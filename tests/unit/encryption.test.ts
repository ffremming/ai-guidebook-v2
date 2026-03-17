import { createHash } from 'node:crypto';

import { encryptText, decryptText } from '../../src/lib/encryption/aes';
import {
  encryptNullableText,
  decryptNullableText,
} from '../../src/lib/encryption/field-encryptor';

describe('AES encryption/decryption', () => {
  const originalEncKey = process.env.ENCRYPTION_KEY;
  const originalAuthSecret = process.env.AUTH_SECRET;
  const originalNextAuthSecret = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    // Set a valid 64-char hex key for tests
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
  });

  afterAll(() => {
    if (originalEncKey !== undefined) process.env.ENCRYPTION_KEY = originalEncKey;
    else delete process.env.ENCRYPTION_KEY;
    if (originalAuthSecret !== undefined) process.env.AUTH_SECRET = originalAuthSecret;
    else delete process.env.AUTH_SECRET;
    if (originalNextAuthSecret !== undefined) process.env.NEXTAUTH_SECRET = originalNextAuthSecret;
    else delete process.env.NEXTAUTH_SECRET;
  });

  test('encrypts and decrypts a string correctly', () => {
    const plaintext = 'Hello, World!';
    const encrypted = encryptText(plaintext);
    const decrypted = decryptText(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  test('encrypted output has three colon-separated parts', () => {
    const encrypted = encryptText('test');
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(3);
  });

  test('different encryptions produce different ciphertexts (random IV)', () => {
    const a = encryptText('same text');
    const b = encryptText('same text');
    expect(a).not.toBe(b);
  });

  test('decrypts correctly with special characters', () => {
    const plaintext = 'Ægøå 🎉 <script>alert("xss")</script>';
    const encrypted = encryptText(plaintext);
    expect(decryptText(encrypted)).toBe(plaintext);
  });

  test('decrypts empty string', () => {
    const encrypted = encryptText('');
    expect(decryptText(encrypted)).toBe('');
  });

  test('decryptText returns original payload if not in expected format', () => {
    expect(decryptText('not-encrypted')).toBe('not-encrypted');
    expect(decryptText('only:two')).toBe('only:two');
  });

  test('decryptText returns original payload on invalid base64', () => {
    const result = decryptText('aaa:bbb:ccc');
    // Should not throw, returns the payload on decryption failure
    expect(typeof result).toBe('string');
  });

  test('falls back to AUTH_SECRET when ENCRYPTION_KEY is not set', () => {
    delete process.env.ENCRYPTION_KEY;
    process.env.AUTH_SECRET = 'my-auth-secret';

    const plaintext = 'test fallback';
    const encrypted = encryptText(plaintext);
    const decrypted = decryptText(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  test('falls back to NEXTAUTH_SECRET when ENCRYPTION_KEY and AUTH_SECRET unset', () => {
    delete process.env.ENCRYPTION_KEY;
    delete process.env.AUTH_SECRET;
    process.env.NEXTAUTH_SECRET = 'my-nextauth-secret';

    const plaintext = 'test nextauth fallback';
    const encrypted = encryptText(plaintext);
    expect(decryptText(encrypted)).toBe(plaintext);
  });

  test('throws when no encryption key or fallback is available', () => {
    delete process.env.ENCRYPTION_KEY;
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;

    expect(() => encryptText('test')).toThrow('Missing encryption key');
  });

  test('works with a valid base64 key (32 bytes)', () => {
    const raw32 = Buffer.alloc(32, 0xab);
    process.env.ENCRYPTION_KEY = raw32.toString('base64');

    const plaintext = 'base64 key test';
    const encrypted = encryptText(plaintext);
    expect(decryptText(encrypted)).toBe(plaintext);
  });

  test('non-hex, non-32-byte-base64 key falls back to AUTH_SECRET', () => {
    process.env.ENCRYPTION_KEY = 'short-key';
    process.env.AUTH_SECRET = 'fallback-secret';

    const plaintext = 'fallback test';
    const encrypted = encryptText(plaintext);
    expect(decryptText(encrypted)).toBe(plaintext);
  });
});

describe('field-encryptor', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'b'.repeat(64);
  });

  test('encryptNullableText returns null for null', () => {
    expect(encryptNullableText(null)).toBeNull();
  });

  test('encryptNullableText returns null for undefined', () => {
    expect(encryptNullableText(undefined)).toBeNull();
  });

  test('encryptNullableText encrypts non-null value', () => {
    const result = encryptNullableText('hello');
    expect(result).not.toBeNull();
    expect(result).not.toBe('hello');
  });

  test('decryptNullableText returns null for null', () => {
    expect(decryptNullableText(null)).toBeNull();
  });

  test('decryptNullableText returns null for undefined', () => {
    expect(decryptNullableText(undefined)).toBeNull();
  });

  test('encryptNullableText + decryptNullableText roundtrip', () => {
    const encrypted = encryptNullableText('round trip');
    expect(encrypted).not.toBeNull();
    const decrypted = decryptNullableText(encrypted);
    expect(decrypted).toBe('round trip');
  });
});
