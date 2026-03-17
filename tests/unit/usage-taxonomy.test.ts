import {
  MANUAL_USAGE_TAXONOMY,
  MANUAL_USAGE_TAXONOMY_VERSION,
  getUsageSectionById,
  isLeafUsageNodeId,
  getUsageTreeRootNodes,
  getUsageNodeIdPath,
  getDescendantLeafNodeIds,
  getTopLevelSectionsForSelections,
  areValidUsageSelections,
  getUsageLabelsForSelections,
} from '../../src/lib/usage-taxonomy';

describe('MANUAL_USAGE_TAXONOMY', () => {
  test('has 6 top-level sections', () => {
    expect(MANUAL_USAGE_TAXONOMY).toHaveLength(6);
  });

  test('version is v1', () => {
    expect(MANUAL_USAGE_TAXONOMY_VERSION).toBe('v1');
  });

  test('each section has id and label', () => {
    for (const section of MANUAL_USAGE_TAXONOMY) {
      expect(section.id).toBeTruthy();
      expect(section.label).toBeTruthy();
    }
  });
});

describe('getUsageSectionById', () => {
  test('returns section for valid id', () => {
    const section = getUsageSectionById('writing');
    expect(section).not.toBeNull();
    expect(section!.label).toBe('Writing');
  });

  test('returns null for invalid id', () => {
    expect(getUsageSectionById('nonexistent')).toBeNull();
  });

  test('returns no-ai section', () => {
    const section = getUsageSectionById('no-ai');
    expect(section).not.toBeNull();
    expect(section!.children).toHaveLength(0);
  });

  test('returns section for each top-level id', () => {
    const ids = ['no-ai', 'writing', 'programming', 'research-and-ideation', 'data-and-analysis', 'presentation-and-communication'];
    for (const id of ids) {
      expect(getUsageSectionById(id)).not.toBeNull();
    }
  });
});

describe('isLeafUsageNodeId', () => {
  test('returns true for leaf nodes', () => {
    expect(isLeafUsageNodeId('partial-text-generation')).toBe(true);
    expect(isLeafUsageNodeId('text-correction')).toBe(true);
    expect(isLeafUsageNodeId('summarization')).toBe(true);
    expect(isLeafUsageNodeId('code-explanation')).toBe(true);
  });

  test('returns false for parent nodes', () => {
    expect(isLeafUsageNodeId('text-generation')).toBe(false);
    expect(isLeafUsageNodeId('code-generation')).toBe(false);
    expect(isLeafUsageNodeId('writing')).toBe(false);
  });

  test('returns false for unknown id', () => {
    expect(isLeafUsageNodeId('nonexistent-node')).toBe(false);
  });

  test('no-ai is treated as a leaf (no children)', () => {
    expect(isLeafUsageNodeId('no-ai')).toBe(true);
  });
});

describe('getUsageTreeRootNodes', () => {
  test('returns array with same length as taxonomy', () => {
    const roots = getUsageTreeRootNodes();
    expect(roots).toHaveLength(MANUAL_USAGE_TAXONOMY.length);
  });

  test('each root has id, label, and children', () => {
    for (const root of getUsageTreeRootNodes()) {
      expect(root.id).toBeTruthy();
      expect(root.label).toBeTruthy();
      expect(root).toHaveProperty('children');
    }
  });
});

describe('getUsageNodeIdPath', () => {
  test('returns path for deeply nested node', () => {
    const path = getUsageNodeIdPath('partial-text-generation');
    expect(path).toEqual(['writing', 'text-generation', 'partial-text-generation']);
  });

  test('returns path for top-level node', () => {
    const path = getUsageNodeIdPath('writing');
    expect(path).toEqual(['writing']);
  });

  test('returns empty array for unknown node', () => {
    expect(getUsageNodeIdPath('nonexistent')).toEqual([]);
  });

  test('returns path for mid-level node', () => {
    const path = getUsageNodeIdPath('text-generation');
    expect(path).toEqual(['writing', 'text-generation']);
  });

  test('returns path for programming child', () => {
    const path = getUsageNodeIdPath('debugging-support');
    expect(path).toEqual(['programming', 'debugging-support']);
  });
});

describe('getDescendantLeafNodeIds', () => {
  test('returns leaf ids for a parent node', () => {
    const leaves = getDescendantLeafNodeIds('text-generation');
    expect(leaves).toContain('partial-text-generation');
    expect(leaves).toContain('full-section-generation');
    expect(leaves).toHaveLength(2);
  });

  test('returns the node itself if it is a leaf', () => {
    const leaves = getDescendantLeafNodeIds('summarization');
    expect(leaves).toEqual(['summarization']);
  });

  test('returns empty array for unknown node', () => {
    expect(getDescendantLeafNodeIds('nonexistent')).toEqual([]);
  });

  test('returns all programming leaves', () => {
    const leaves = getDescendantLeafNodeIds('programming');
    expect(leaves).toContain('code-explanation');
    expect(leaves).toContain('debugging-support');
    expect(leaves).toContain('partial-code-generation');
    expect(leaves).toContain('full-solution-generation');
    expect(leaves).toContain('test-generation');
    expect(leaves).toContain('refactoring-suggestions');
  });

  test('no-ai returns itself (no children)', () => {
    const leaves = getDescendantLeafNodeIds('no-ai');
    expect(leaves).toEqual(['no-ai']);
  });
});

describe('getTopLevelSectionsForSelections', () => {
  test('returns unique sections for selections', () => {
    const sections = getTopLevelSectionsForSelections([
      'partial-text-generation',
      'summarization',
    ]);
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe('writing');
  });

  test('returns multiple sections for cross-section selections', () => {
    const sections = getTopLevelSectionsForSelections([
      'partial-text-generation',
      'code-explanation',
    ]);
    expect(sections).toHaveLength(2);
    const ids = sections.map((s) => s.id);
    expect(ids).toContain('writing');
    expect(ids).toContain('programming');
  });

  test('returns empty array for empty selections', () => {
    expect(getTopLevelSectionsForSelections([])).toEqual([]);
  });

  test('ignores unknown node ids', () => {
    const sections = getTopLevelSectionsForSelections(['nonexistent']);
    expect(sections).toHaveLength(0);
  });
});

describe('areValidUsageSelections', () => {
  test('returns true for valid leaf selections', () => {
    expect(areValidUsageSelections(['partial-text-generation', 'summarization'])).toBe(true);
  });

  test('returns true for valid parent selections', () => {
    expect(areValidUsageSelections(['writing'])).toBe(true);
  });

  test('returns false for empty array', () => {
    expect(areValidUsageSelections([])).toBe(false);
  });

  test('returns false when any node id is invalid', () => {
    expect(areValidUsageSelections(['partial-text-generation', 'invalid-node'])).toBe(false);
  });

  test('returns false for duplicate selections', () => {
    expect(areValidUsageSelections(['summarization', 'summarization'])).toBe(false);
  });
});

describe('getUsageLabelsForSelections', () => {
  test('returns labels for valid selections', () => {
    const result = getUsageLabelsForSelections(['partial-text-generation']);
    expect(result.subsectionLabels).toContain('Partial text generation');
    expect(result.sectionLabels).toContain('Writing');
    expect(result.sectionIds).toContain('writing');
  });

  test('returns paths for selections', () => {
    const result = getUsageLabelsForSelections(['partial-text-generation']);
    expect(result.subsectionLabelPaths).toHaveLength(1);
    expect(result.subsectionLabelPaths[0]).toContain(' > ');
  });

  test('returns empty arrays for empty input', () => {
    const result = getUsageLabelsForSelections([]);
    expect(result.subsectionLabels).toEqual([]);
    expect(result.sectionLabels).toEqual([]);
    expect(result.sectionIds).toEqual([]);
    expect(result.subsectionLabelPaths).toEqual([]);
  });

  test('handles unknown node ids gracefully', () => {
    const result = getUsageLabelsForSelections(['nonexistent']);
    expect(result.subsectionLabels).toEqual([]);
    expect(result.sectionLabels).toEqual([]);
  });

  test('returns labels from multiple sections', () => {
    const result = getUsageLabelsForSelections([
      'partial-text-generation',
      'code-explanation',
    ]);
    expect(result.sectionLabels).toContain('Writing');
    expect(result.sectionLabels).toContain('Programming');
    expect(result.subsectionLabels).toHaveLength(2);
  });
});
