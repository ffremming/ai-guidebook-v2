import { SeverityLevel } from '@prisma/client';

import { ConflictDetector } from '../../src/lib/compliance/conflict-detector';
import type {
  PolicyRuleProvider,
  PolicyRuleRecord,
} from '../../src/lib/compliance/policy-evaluator';

const rules: PolicyRuleRecord[] = [
  {
    usageCategory: 'Grammar Fix',
    severityLevel: SeverityLevel.ALLOWED,
    ruleReference: 'R-1',
    keywords: ['grammar'],
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
    keywords: ['full text'],
  },
  {
    usageCategory: 'Exam Cheating',
    severityLevel: SeverityLevel.SERIOUS,
    ruleReference: 'R-4',
    keywords: ['exam'],
  },
];

class MockRuleProvider implements PolicyRuleProvider {
  async getRules(): Promise<PolicyRuleRecord[]> {
    return rules;
  }
}

describe('ConflictDetector', () => {
  const detector = new ConflictDetector(new MockRuleProvider());
  const policyId = 'test-policy';

  test('flags conflict when actual severity > intent severity', async () => {
    const result = await detector.detect('Grammar Fix', 'Code Generation', policyId);
    expect(result.conflictFlag).toBe(true);
    expect(result.directViolationFlag).toBe(false);
    expect(result.flagSeverity).toBe(SeverityLevel.MODERATE);
  });

  test('no conflict when actual severity < intent severity', async () => {
    const result = await detector.detect('Code Generation', 'Grammar Fix', policyId);
    expect(result.conflictFlag).toBe(false);
    expect(result.directViolationFlag).toBe(false);
    expect(result.flagSeverity).toBe(SeverityLevel.ALLOWED);
  });

  test('no conflict when categories match', async () => {
    const result = await detector.detect('Grammar Fix', 'Grammar Fix', policyId);
    expect(result.conflictFlag).toBe(false);
    expect(result.directViolationFlag).toBe(false);
  });

  test('directViolationFlag true for FORBIDDEN actual category', async () => {
    const result = await detector.detect('Grammar Fix', 'Full Text', policyId);
    expect(result.conflictFlag).toBe(true);
    expect(result.directViolationFlag).toBe(true);
    expect(result.flagSeverity).toBe(SeverityLevel.FORBIDDEN);
  });

  test('directViolationFlag true for SERIOUS actual category', async () => {
    const result = await detector.detect('Grammar Fix', 'Exam Cheating', policyId);
    expect(result.directViolationFlag).toBe(true);
    expect(result.flagSeverity).toBe(SeverityLevel.SERIOUS);
  });

  test('no conflict when intent is null', async () => {
    const result = await detector.detect(null, 'Grammar Fix', policyId);
    expect(result.conflictFlag).toBe(false);
  });

  test('no conflict when actual is null', async () => {
    const result = await detector.detect('Grammar Fix', null, policyId);
    expect(result.conflictFlag).toBe(false);
    expect(result.directViolationFlag).toBe(false);
    expect(result.flagSeverity).toBeNull();
  });

  test('both null yields no conflict and no violation', async () => {
    const result = await detector.detect(null, null, policyId);
    expect(result.conflictFlag).toBe(false);
    expect(result.directViolationFlag).toBe(false);
    expect(result.flagSeverity).toBeNull();
    expect(result.ruleReferences).toEqual([]);
  });

  test('deduplicates rule references when same rule applies to both', async () => {
    const result = await detector.detect('Grammar Fix', 'Grammar Fix', policyId);
    const uniqueRefs = new Set(result.ruleReferences);
    expect(uniqueRefs.size).toBe(result.ruleReferences.length);
  });

  test('returns rule references from both intent and actual rules', async () => {
    const result = await detector.detect('Grammar Fix', 'Code Generation', policyId);
    expect(result.ruleReferences).toContain('R-1');
    expect(result.ruleReferences).toContain('R-2');
  });

  test('unknown actual category results in null severity', async () => {
    const result = await detector.detect('Grammar Fix', 'NonExistent', policyId);
    expect(result.flagSeverity).toBeNull();
    expect(result.directViolationFlag).toBe(false);
  });
});
