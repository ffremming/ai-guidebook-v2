import { ComplianceStatus, SeverityLevel } from '@prisma/client';

import {
  PolicyEvaluatorService,
  type PolicyRuleProvider,
  type PolicyRuleRecord,
} from '../../src/lib/compliance/policy-evaluator';
import type { ContentClassifierStrategy } from '../../src/lib/compliance/content-classifier';

const rules: PolicyRuleRecord[] = [
  {
    usageCategory: 'Grammar Fix',
    severityLevel: SeverityLevel.ALLOWED,
    ruleReference: 'R-1',
    keywords: ['grammar', 'proofread'],
  },
  {
    usageCategory: 'Code Generation',
    severityLevel: SeverityLevel.MODERATE,
    ruleReference: 'R-2',
    keywords: ['generate code'],
  },
  {
    usageCategory: 'Full Text',
    severityLevel: SeverityLevel.FORBIDDEN,
    ruleReference: 'R-3',
    keywords: ['full text', 'entire essay'],
  },
];

class MockRuleProvider implements PolicyRuleProvider {
  async getRules(): Promise<PolicyRuleRecord[]> {
    return rules;
  }
}

class MockClassifier implements ContentClassifierStrategy {
  private category: string | null;
  constructor(category: string | null) {
    this.category = category;
  }
  classify() {
    return {
      detectedCategory: this.category,
      ruleReferences: this.category ? ['R-mock'] : [],
    };
  }
}

describe('PolicyEvaluatorService.evaluateIntent', () => {
  const service = new PolicyEvaluatorService({
    ruleProvider: new MockRuleProvider(),
  });

  test('delegates to intent evaluator and returns result', async () => {
    const result = await service.evaluateIntent('fix grammar', 'policy-v1');
    expect(result.detectedCategory).toBe('Grammar Fix');
    expect(result.complianceStatus).toBe(ComplianceStatus.COMPLIANT);
  });

  test('returns WARNING when no match', async () => {
    const result = await service.evaluateIntent('unrelated text', 'policy-v1');
    expect(result.detectedCategory).toBeNull();
    expect(result.complianceStatus).toBe(ComplianceStatus.WARNING);
  });
});

describe('PolicyEvaluatorService.evaluatePostSession', () => {
  test('returns COMPLIANT when no conflict and category detected', async () => {
    const service = new PolicyEvaluatorService({
      ruleProvider: new MockRuleProvider(),
      classifier: new MockClassifier('Grammar Fix'),
    });

    const result = await service.evaluatePostSession({
      logId: 'log-1',
      sessionText: 'some session text',
      policyVersionId: 'pv-1',
      intentCategory: 'Grammar Fix',
    });

    expect(result.complianceStatus).toBe(ComplianceStatus.COMPLIANT);
    expect(result.conflictFlag).toBe(false);
    expect(result.directViolationFlag).toBe(false);
    expect(result.actualCategory).toBe('Grammar Fix');
    expect(result.logId).toBe('log-1');
  });

  test('returns NON_COMPLIANT when conflict detected', async () => {
    const service = new PolicyEvaluatorService({
      ruleProvider: new MockRuleProvider(),
      classifier: new MockClassifier('Full Text'),
    });

    const result = await service.evaluatePostSession({
      logId: 'log-2',
      sessionText: 'full text generation',
      policyVersionId: 'pv-1',
      intentCategory: 'Grammar Fix',
    });

    expect(result.complianceStatus).toBe(ComplianceStatus.NON_COMPLIANT);
    expect(result.directViolationFlag).toBe(true);
    expect(result.conflictFlag).toBe(true);
  });

  test('returns WARNING when no category detected', async () => {
    const service = new PolicyEvaluatorService({
      ruleProvider: new MockRuleProvider(),
      classifier: new MockClassifier(null),
    });

    const result = await service.evaluatePostSession({
      logId: 'log-3',
      sessionText: 'ambiguous text',
      policyVersionId: 'pv-1',
      intentCategory: 'Grammar Fix',
    });

    expect(result.complianceStatus).toBe(ComplianceStatus.WARNING);
    expect(result.actualCategory).toBeNull();
    expect(result.message).toBe('Could not classify post-session content');
  });

  test('handles null intentCategory', async () => {
    const service = new PolicyEvaluatorService({
      ruleProvider: new MockRuleProvider(),
      classifier: new MockClassifier('Grammar Fix'),
    });

    const result = await service.evaluatePostSession({
      logId: 'log-4',
      sessionText: 'text',
      policyVersionId: 'pv-1',
      intentCategory: null,
    });

    expect(result.intentCategory).toBeNull();
    expect(result.complianceStatus).toBe(ComplianceStatus.COMPLIANT);
  });

  test('handles undefined intentCategory', async () => {
    const service = new PolicyEvaluatorService({
      ruleProvider: new MockRuleProvider(),
      classifier: new MockClassifier('Grammar Fix'),
    });

    const result = await service.evaluatePostSession({
      logId: 'log-5',
      sessionText: 'text',
      policyVersionId: 'pv-1',
    });

    expect(result.intentCategory).toBeNull();
  });

  test('message includes detected category when present', async () => {
    const service = new PolicyEvaluatorService({
      ruleProvider: new MockRuleProvider(),
      classifier: new MockClassifier('Code Generation'),
    });

    const result = await service.evaluatePostSession({
      logId: 'log-6',
      sessionText: 'text',
      policyVersionId: 'pv-1',
      intentCategory: 'Code Generation',
    });

    expect(result.message).toBe(
      'Post-session category classified as Code Generation',
    );
  });
});
