import { describe, expect, it } from 'vitest';
import { UserRole } from '@home-owners-hub/shared-types';
import { decodeToken, isTokenExpired, type JwtPayload } from './jwt';

function makePayload(overrides: Partial<JwtPayload> = {}): JwtPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: 'user-1',
    email: 'test@example.com',
    role: UserRole.USER,
    iat: now - 60,
    exp: now + 3600,
    ...overrides,
  };
}

function encodeToken(payload: JwtPayload): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

describe('decodeToken', () => {
  it('returns the payload from a valid token', () => {
    const payload = makePayload();
    const token = encodeToken(payload);

    const result = decodeToken(token);

    expect(result?.sub).toBe(payload.sub);
    expect(result?.email).toBe(payload.email);
    expect(result?.role).toBe(payload.role);
  });

  it('returns null for a malformed token', () => {
    expect(decodeToken('not.a.jwt')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(decodeToken('')).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('returns false when the token is not expired', () => {
    const payload = makePayload({ exp: Math.floor(Date.now() / 1000) + 3600 });

    expect(isTokenExpired(payload)).toBe(false);
  });

  it('returns true when the token is expired', () => {
    const payload = makePayload({ exp: Math.floor(Date.now() / 1000) - 1 });

    expect(isTokenExpired(payload)).toBe(true);
  });
});
