import { intentCheckSchema, classifySchema } from '../../src/lib/validations/compliance.schema';
import { createResolutionSchema } from '../../src/lib/validations/resolution.schema';
import { patchDeclarationSchema } from '../../src/lib/validations/declaration.schema';
import { createLogSchema } from '../../src/lib/validations/log.schema';

const validUuid = '550e8400-e29b-41d4-a716-446655440000';

describe('intentCheckSchema', () => {
  test('accepts valid input', () => {
    const result = intentCheckSchema.safeParse({
      reason: 'I need help with grammar',
      assignmentId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  test('rejects empty reason', () => {
    const result = intentCheckSchema.safeParse({
      reason: '',
      assignmentId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  test('rejects reason exceeding 2000 characters', () => {
    const result = intentCheckSchema.safeParse({
      reason: 'x'.repeat(2001),
      assignmentId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid UUID for assignmentId', () => {
    const result = intentCheckSchema.safeParse({
      reason: 'valid reason',
      assignmentId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  test('trims reason whitespace', () => {
    const result = intentCheckSchema.safeParse({
      reason: '  valid reason  ',
      assignmentId: validUuid,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe('valid reason');
    }
  });
});

describe('classifySchema', () => {
  test('accepts valid UUID', () => {
    const result = classifySchema.safeParse({ logId: validUuid });
    expect(result.success).toBe(true);
  });

  test('rejects invalid UUID', () => {
    const result = classifySchema.safeParse({ logId: 'bad' });
    expect(result.success).toBe(false);
  });
});

describe('createResolutionSchema', () => {
  test('accepts valid input', () => {
    const result = createResolutionSchema.safeParse({
      logId: validUuid,
      narrativeExplanation: 'This is a detailed explanation of what happened during the session',
    });
    expect(result.success).toBe(true);
  });

  test('rejects narrativeExplanation shorter than 20 chars', () => {
    const result = createResolutionSchema.safeParse({
      logId: validUuid,
      narrativeExplanation: 'too short',
    });
    expect(result.success).toBe(false);
  });

  test('rejects narrativeExplanation exceeding 20000 chars', () => {
    const result = createResolutionSchema.safeParse({
      logId: validUuid,
      narrativeExplanation: 'x'.repeat(20001),
    });
    expect(result.success).toBe(false);
  });

  test('accepts optional disputedCategory', () => {
    const result = createResolutionSchema.safeParse({
      logId: validUuid,
      narrativeExplanation: 'This is a valid explanation text here',
      disputedCategory: 'Code Generation',
    });
    expect(result.success).toBe(true);
  });

  test('accepts optional disputeEvidence', () => {
    const result = createResolutionSchema.safeParse({
      logId: validUuid,
      narrativeExplanation: 'This is a valid explanation text here',
      disputeEvidence: 'Evidence that supports the dispute',
    });
    expect(result.success).toBe(true);
  });

  test('rejects invalid logId', () => {
    const result = createResolutionSchema.safeParse({
      logId: 'not-uuid',
      narrativeExplanation: 'This is a valid explanation text here',
    });
    expect(result.success).toBe(false);
  });

  test('rejects disputedCategory exceeding 100 chars', () => {
    const result = createResolutionSchema.safeParse({
      logId: validUuid,
      narrativeExplanation: 'This is a valid explanation text here',
      disputedCategory: 'x'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe('patchDeclarationSchema', () => {
  test('accepts valid studentRemarks', () => {
    const result = patchDeclarationSchema.safeParse({
      studentRemarks: 'My remarks',
    });
    expect(result.success).toBe(true);
  });

  test('accepts null studentRemarks', () => {
    const result = patchDeclarationSchema.safeParse({
      studentRemarks: null,
    });
    expect(result.success).toBe(true);
  });

  test('accepts empty object', () => {
    const result = patchDeclarationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  test('rejects unknown fields (strict mode)', () => {
    const result = patchDeclarationSchema.safeParse({
      studentRemarks: 'valid',
      unknownField: 'bad',
    });
    expect(result.success).toBe(false);
  });

  test('rejects studentRemarks exceeding 20000 chars', () => {
    const result = patchDeclarationSchema.safeParse({
      studentRemarks: 'x'.repeat(20001),
    });
    expect(result.success).toBe(false);
  });
});

describe('createLogSchema', () => {
  const validLog = {
    assignmentId: validUuid,
    usageSubsections: ['summarization'],
    usageReason: 'I used AI for summarization',
    aiTool: 'ChatGPT',
    usageEvidence: [],
  };

  test('accepts valid input', () => {
    const result = createLogSchema.safeParse(validLog);
    expect(result.success).toBe(true);
  });

  test('rejects empty usageSubsections', () => {
    const result = createLogSchema.safeParse({
      ...validLog,
      usageSubsections: [],
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid assignmentId', () => {
    const result = createLogSchema.safeParse({
      ...validLog,
      assignmentId: 'not-uuid',
    });
    expect(result.success).toBe(false);
  });

  test('rejects invalid usage node ids', () => {
    const result = createLogSchema.safeParse({
      ...validLog,
      usageSubsections: ['nonexistent-node'],
    });
    expect(result.success).toBe(false);
  });

  test('rejects more than 30 usageSubsections', () => {
    const result = createLogSchema.safeParse({
      ...validLog,
      usageSubsections: Array.from({ length: 31 }, (_, i) => `node-${i}`),
    });
    expect(result.success).toBe(false);
  });

  test('rejects aiTool exceeding 100 chars', () => {
    const result = createLogSchema.safeParse({
      ...validLog,
      aiTool: 'x'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  test('rejects usageReason exceeding 5000 chars', () => {
    const result = createLogSchema.safeParse({
      ...validLog,
      usageReason: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  test('accepts optional sessionDescription', () => {
    const result = createLogSchema.safeParse({
      ...validLog,
      sessionDescription: 'A session description',
    });
    expect(result.success).toBe(true);
  });

  test('accepts empty string sessionDescription', () => {
    const result = createLogSchema.safeParse({
      ...validLog,
      sessionDescription: '',
    });
    expect(result.success).toBe(true);
  });

  test('rejects evidence with nodeId not in usageSubsections', () => {
    const result = createLogSchema.safeParse({
      ...validLog,
      usageSubsections: ['summarization'],
      usageEvidence: [{ nodeId: 'translation', text: 'some evidence' }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects evidence on root category node', () => {
    const result = createLogSchema.safeParse({
      ...validLog,
      usageSubsections: ['writing'],
      usageEvidence: [{ nodeId: 'writing', text: 'some evidence' }],
    });
    expect(result.success).toBe(false);
  });

  test('rejects evidence on non-leaf node', () => {
    const result = createLogSchema.safeParse({
      ...validLog,
      usageSubsections: ['text-generation'],
      usageEvidence: [{ nodeId: 'text-generation', text: 'evidence' }],
    });
    expect(result.success).toBe(false);
  });

  test('accepts valid evidence on leaf node in selected subsections', () => {
    const result = createLogSchema.safeParse({
      ...validLog,
      usageSubsections: ['summarization'],
      usageEvidence: [{ nodeId: 'summarization', text: 'I used it for summarization' }],
    });
    expect(result.success).toBe(true);
  });

  test('rejects more than 200 evidence items', () => {
    const evidence = Array.from({ length: 201 }, () => ({
      nodeId: 'summarization',
      text: 'evidence',
    }));
    const result = createLogSchema.safeParse({
      ...validLog,
      usageSubsections: ['summarization'],
      usageEvidence: evidence,
    });
    expect(result.success).toBe(false);
  });
});
