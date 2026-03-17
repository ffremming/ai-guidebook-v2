import { ComplianceStatus, SeverityLevel } from '@prisma/client';

import { evaluateIntentFromRules } from '../../src/lib/compliance/intent-evaluator';
import type { PolicyRuleRecord } from '../../src/lib/compliance/policy-evaluator';

const rules: PolicyRuleRecord[] = [
  {
    usageCategory: 'Grammar Fix',
    severityLevel: SeverityLevel.ALLOWED,
    ruleReference: 'R-1',
    keywords: ['grammar', 'proofread', 'spelling'],
  },
  {
    usageCategory: 'Code Debugging',
    severityLevel: SeverityLevel.MINOR,
    ruleReference: 'R-2',
    keywords: ['debug', 'traceback', 'stack trace'],
  },
  {
    usageCategory: 'Code Generation',
    severityLevel: SeverityLevel.MODERATE,
    ruleReference: 'R-3',
    keywords: ['generate code', 'implement function', 'scaffold'],
  },
  {
    usageCategory: 'Exam Cheating',
    severityLevel: SeverityLevel.SERIOUS,
    ruleReference: 'R-4',
    keywords: ['exam answers', 'cheat'],
  },
  {
    usageCategory: 'Full Text Generation',
    severityLevel: SeverityLevel.FORBIDDEN,
    ruleReference: 'R-5',
    keywords: ['write my entire essay', 'full text'],
  },
];

describe('evaluateIntentFromRules', () => {
  test('detects ALLOWED category and returns COMPLIANT', () => {
    const result = evaluateIntentFromRules('Fix my grammar please', rules);
    expect(result.detectedCategory).toBe('Grammar Fix');
    expect(result.complianceStatus).toBe(ComplianceStatus.COMPLIANT);
    expect(result.severityLevel).toBe(SeverityLevel.ALLOWED);
    expect(result.ruleReferences).toEqual(['R-1']);
  });

  test('detects MINOR category and returns COMPLIANT', () => {
    const result = evaluateIntentFromRules('Help me debug this traceback', rules);
    expect(result.detectedCategory).toBe('Code Debugging');
    expect(result.complianceStatus).toBe(ComplianceStatus.COMPLIANT);
    expect(result.severityLevel).toBe(SeverityLevel.MINOR);
  });

  test('detects MODERATE category and returns WARNING', () => {
    const result = evaluateIntentFromRules('Please generate code for a scaffold', rules);
    expect(result.detectedCategory).toBe('Code Generation');
    expect(result.complianceStatus).toBe(ComplianceStatus.WARNING);
    expect(result.severityLevel).toBe(SeverityLevel.MODERATE);
  });

  test('detects SERIOUS category and returns NON_COMPLIANT', () => {
    const result = evaluateIntentFromRules('Give me exam answers so I can cheat', rules);
    expect(result.detectedCategory).toBe('Exam Cheating');
    expect(result.complianceStatus).toBe(ComplianceStatus.NON_COMPLIANT);
    expect(result.severityLevel).toBe(SeverityLevel.SERIOUS);
  });

  test('detects FORBIDDEN category and returns NON_COMPLIANT', () => {
    const result = evaluateIntentFromRules('Write my entire essay full text', rules);
    expect(result.detectedCategory).toBe('Full Text Generation');
    expect(result.complianceStatus).toBe(ComplianceStatus.NON_COMPLIANT);
    expect(result.severityLevel).toBe(SeverityLevel.FORBIDDEN);
  });

  test('returns WARNING with null category when no match', () => {
    const result = evaluateIntentFromRules('random unrelated text', rules);
    expect(result.detectedCategory).toBeNull();
    expect(result.complianceStatus).toBe(ComplianceStatus.WARNING);
    expect(result.severityLevel).toBeNull();
    expect(result.ruleReferences).toEqual([]);
    expect(result.message).toBe(
      'Could not determine usage category — please be more specific',
    );
  });

  test('returns correct message on match', () => {
    const result = evaluateIntentFromRules('Fix grammar', rules);
    expect(result.message).toBe('Detected category: Grammar Fix');
  });

  test('handles empty rules array', () => {
    const result = evaluateIntentFromRules('grammar proofread', []);
    expect(result.detectedCategory).toBeNull();
    expect(result.complianceStatus).toBe(ComplianceStatus.WARNING);
  });

  test('picks best match by keyword score', () => {
    const result = evaluateIntentFromRules(
      'I need to proofread grammar and fix spelling errors',
      rules,
    );
    expect(result.detectedCategory).toBe('Grammar Fix');
  });

  test('is case-insensitive', () => {
    const result = evaluateIntentFromRules('GRAMMAR PROOFREAD', rules);
    expect(result.detectedCategory).toBe('Grammar Fix');
  });

  test('skips empty keywords gracefully', () => {
    const rulesWithEmpty: PolicyRuleRecord[] = [
      {
        usageCategory: 'Test',
        severityLevel: SeverityLevel.MINOR,
        ruleReference: 'R-X',
        keywords: ['', 'valid'],
      },
    ];
    const result = evaluateIntentFromRules('this is valid', rulesWithEmpty);
    expect(result.detectedCategory).toBe('Test');
  });
});
