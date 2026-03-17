import {
  isUsageNodeAllowedByRules,
  findDisallowedUsageSelections,
  findWarningParentSelections,
} from '../../src/lib/db/course-usage-rules';

describe('isUsageNodeAllowedByRules', () => {
  test('returns true when no rules restrict the node', () => {
    const ruleMap = new Map<string, boolean>();
    expect(isUsageNodeAllowedByRules('summarization', ruleMap)).toBe(true);
  });

  test('returns false when a node in the path is disallowed', () => {
    const ruleMap = new Map<string, boolean>([['writing', false]]);
    expect(isUsageNodeAllowedByRules('partial-text-generation', ruleMap)).toBe(false);
  });

  test('returns false when the exact node is disallowed', () => {
    const ruleMap = new Map<string, boolean>([['summarization', false]]);
    expect(isUsageNodeAllowedByRules('summarization', ruleMap)).toBe(false);
  });

  test('returns true when an ancestor is allowed', () => {
    const ruleMap = new Map<string, boolean>([['writing', true]]);
    expect(isUsageNodeAllowedByRules('summarization', ruleMap)).toBe(true);
  });

  test('returns true for unknown node id (no path)', () => {
    const ruleMap = new Map<string, boolean>([['writing', false]]);
    expect(isUsageNodeAllowedByRules('nonexistent', ruleMap)).toBe(true);
  });

  test('correctly handles mid-path disallow', () => {
    const ruleMap = new Map<string, boolean>([['text-generation', false]]);
    expect(isUsageNodeAllowedByRules('partial-text-generation', ruleMap)).toBe(false);
    expect(isUsageNodeAllowedByRules('summarization', ruleMap)).toBe(true);
  });
});

describe('findDisallowedUsageSelections', () => {
  test('returns empty when nothing is disallowed', () => {
    const ruleMap = new Map<string, boolean>();
    expect(findDisallowedUsageSelections(['summarization'], ruleMap)).toEqual([]);
  });

  test('returns disallowed node ids', () => {
    const ruleMap = new Map<string, boolean>([['writing', false]]);
    const result = findDisallowedUsageSelections(
      ['summarization', 'code-explanation'],
      ruleMap,
    );
    expect(result).toContain('summarization');
    expect(result).not.toContain('code-explanation');
  });

  test('returns empty for empty input', () => {
    const ruleMap = new Map<string, boolean>([['writing', false]]);
    expect(findDisallowedUsageSelections([], ruleMap)).toEqual([]);
  });
});

describe('findWarningParentSelections', () => {
  test('returns parent nodes that contain disallowed descendants', () => {
    const ruleMap = new Map<string, boolean>([['full-section-generation', false]]);
    const result = findWarningParentSelections(['text-generation'], ruleMap);
    expect(result).toContain('text-generation');
  });

  test('does not return leaf nodes', () => {
    const ruleMap = new Map<string, boolean>([['summarization', false]]);
    const result = findWarningParentSelections(['summarization'], ruleMap);
    expect(result).toEqual([]);
  });

  test('returns empty when no descendants are disallowed', () => {
    const ruleMap = new Map<string, boolean>();
    const result = findWarningParentSelections(['text-generation'], ruleMap);
    expect(result).toEqual([]);
  });

  test('returns empty for empty input', () => {
    expect(findWarningParentSelections([], new Map())).toEqual([]);
  });

  test('handles writing section with full-section-generation disallowed', () => {
    const ruleMap = new Map<string, boolean>([['full-section-generation', false]]);
    const result = findWarningParentSelections(['writing'], ruleMap);
    expect(result).toContain('writing');
  });
});
