import { resolveInternalClassifyToken } from '../../src/lib/auth/internal-token';

describe('resolveInternalClassifyToken', () => {
  const originalInternal = process.env.INTERNAL_CLASSIFY_TOKEN;
  const originalAuth = process.env.AUTH_SECRET;
  const originalNextAuth = process.env.NEXTAUTH_SECRET;

  afterEach(() => {
    if (originalInternal !== undefined) process.env.INTERNAL_CLASSIFY_TOKEN = originalInternal;
    else delete process.env.INTERNAL_CLASSIFY_TOKEN;
    if (originalAuth !== undefined) process.env.AUTH_SECRET = originalAuth;
    else delete process.env.AUTH_SECRET;
    if (originalNextAuth !== undefined) process.env.NEXTAUTH_SECRET = originalNextAuth;
    else delete process.env.NEXTAUTH_SECRET;
  });

  test('returns INTERNAL_CLASSIFY_TOKEN when set', () => {
    process.env.INTERNAL_CLASSIFY_TOKEN = 'my-token';
    process.env.AUTH_SECRET = 'auth-secret';
    expect(resolveInternalClassifyToken()).toBe('my-token');
  });

  test('falls back to AUTH_SECRET', () => {
    delete process.env.INTERNAL_CLASSIFY_TOKEN;
    process.env.AUTH_SECRET = 'auth-secret';
    expect(resolveInternalClassifyToken()).toBe('auth-secret');
  });

  test('falls back to NEXTAUTH_SECRET', () => {
    delete process.env.INTERNAL_CLASSIFY_TOKEN;
    delete process.env.AUTH_SECRET;
    process.env.NEXTAUTH_SECRET = 'nextauth-secret';
    expect(resolveInternalClassifyToken()).toBe('nextauth-secret');
  });

  test('returns null when no env vars are set', () => {
    delete process.env.INTERNAL_CLASSIFY_TOKEN;
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    expect(resolveInternalClassifyToken()).toBeNull();
  });
});
