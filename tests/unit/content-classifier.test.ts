import { SeverityLevel } from '@prisma/client';

import {
  createContentClassifierFromEnv,
  severityRank,
} from '../../src/lib/compliance/content-classifier';
import type { PolicyRuleRecord } from '../../src/lib/compliance/policy-evaluator';

const rules: PolicyRuleRecord[] = [
  {
    usageCategory: 'Grammar Fix',
    severityLevel: SeverityLevel.ALLOWED,
    ruleReference: 'R-1',
    keywords: ['grammar', 'proofread', 'spelling'],
  },
  {
    usageCategory: 'Code Generation',
    severityLevel: SeverityLevel.MODERATE,
    ruleReference: 'R-2',
    keywords: ['generate code', 'implement function'],
  },
  {
    usageCategory: 'Full Text',
    severityLevel: SeverityLevel.FORBIDDEN,
    ruleReference: 'R-3',
    keywords: ['write my entire essay', 'full text'],
  },
];

describe('KeywordContentClassifier', () => {
  const classifier = createContentClassifierFromEnv();

  test('classifies text matching a single rule', () => {
    const result = classifier.classify('please proofread my grammar', rules);
    expect(result.detectedCategory).toBe('Grammar Fix');
    expect(result.ruleReferences).toEqual(['R-1']);
  });

  test('returns null when no keywords match', () => {
    const result = classifier.classify('random text with no matches', rules);
    expect(result.detectedCategory).toBeNull();
    expect(result.ruleReferences).toEqual([]);
  });

  test('picks the rule with the highest keyword score', () => {
    const result = classifier.classify(
      'I need help with grammar and spelling and proofread',
      rules,
    );
    expect(result.detectedCategory).toBe('Grammar Fix');
  });

  test('is case-insensitive', () => {
    const result = classifier.classify('GRAMMAR PROOFREAD', rules);
    expect(result.detectedCategory).toBe('Grammar Fix');
  });

  test('trims whitespace from input', () => {
    const result = classifier.classify('   grammar   ', rules);
    expect(result.detectedCategory).toBe('Grammar Fix');
  });

  test('skips empty keywords', () => {
    const rulesWithEmpty: PolicyRuleRecord[] = [
      {
        usageCategory: 'Test',
        severityLevel: SeverityLevel.MINOR,
        ruleReference: 'R-X',
        keywords: ['', '  ', 'match'],
      },
    ];
    const result = classifier.classify('this should match', rulesWithEmpty);
    expect(result.detectedCategory).toBe('Test');
  });

  test('returns empty rules array when no match', () => {
    const result = classifier.classify('nothing here', rules);
    expect(result.ruleReferences).toHaveLength(0);
  });

  test('handles empty rules array', () => {
    const result = classifier.classify('grammar proofread', []);
    expect(result.detectedCategory).toBeNull();
  });

  test('handles empty text', () => {
    const result = classifier.classify('', rules);
    expect(result.detectedCategory).toBeNull();
  });
});

describe('createContentClassifierFromEnv', () => {
  const originalEnv = process.env.CLASSIFIER_STRATEGY;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.CLASSIFIER_STRATEGY = originalEnv;
    } else {
      delete process.env.CLASSIFIER_STRATEGY;
    }
  });

  test('returns keyword classifier by default', () => {
    delete process.env.CLASSIFIER_STRATEGY;
    const c = createContentClassifierFromEnv();
    expect(c).toBeDefined();
    expect(typeof c.classify).toBe('function');
  });

  test('returns keyword classifier for "keyword" strategy', () => {
    process.env.CLASSIFIER_STRATEGY = 'keyword';
    const c = createContentClassifierFromEnv();
    expect(c).toBeDefined();
  });

  test('returns keyword-v1 classifier', () => {
    process.env.CLASSIFIER_STRATEGY = 'keyword-v1';
    const c = createContentClassifierFromEnv();
    expect(c).toBeDefined();
  });

  test('falls back to keyword for unknown strategy', () => {
    process.env.CLASSIFIER_STRATEGY = 'unknown-strategy';
    const c = createContentClassifierFromEnv();
    expect(c).toBeDefined();
    const result = c.classify('grammar', rules);
    expect(result.detectedCategory).toBe('Grammar Fix');
  });

  test('trims and lowercases strategy name', () => {
    process.env.CLASSIFIER_STRATEGY = '  KEYWORD  ';
    const c = createContentClassifierFromEnv();
    const result = c.classify('grammar', rules);
    expect(result.detectedCategory).toBe('Grammar Fix');
  });
});

describe('severityRank', () => {
  test('returns correct ranks for all severity levels', () => {
    expect(severityRank(SeverityLevel.ALLOWED)).toBe(0);
    expect(severityRank(SeverityLevel.MINOR)).toBe(1);
    expect(severityRank(SeverityLevel.MODERATE)).toBe(2);
    expect(severityRank(SeverityLevel.SERIOUS)).toBe(3);
    expect(severityRank(SeverityLevel.FORBIDDEN)).toBe(4);
  });

  test('returns -1 for unknown severity', () => {
    expect(severityRank('UNKNOWN' as SeverityLevel)).toBe(-1);
  });

  test('FORBIDDEN ranks higher than ALLOWED', () => {
    expect(severityRank(SeverityLevel.FORBIDDEN)).toBeGreaterThan(
      severityRank(SeverityLevel.ALLOWED),
    );
  });
});
