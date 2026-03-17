import { AuthError } from '../../src/lib/auth/errors';

describe('AuthError', () => {
  test('AUTH_REQUIRED sets status 401', () => {
    const error = new AuthError('AUTH_REQUIRED', 'Login required');
    expect(error.status).toBe(401);
    expect(error.code).toBe('AUTH_REQUIRED');
    expect(error.message).toBe('Login required');
    expect(error.name).toBe('AuthError');
  });

  test('FORBIDDEN sets status 403', () => {
    const error = new AuthError('FORBIDDEN', 'Access denied');
    expect(error.status).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toBe('Access denied');
  });

  test('is an instance of Error', () => {
    const error = new AuthError('AUTH_REQUIRED', 'test');
    expect(error).toBeInstanceOf(Error);
  });

  test('has correct name property', () => {
    const error = new AuthError('FORBIDDEN', 'test');
    expect(error.name).toBe('AuthError');
  });
});
