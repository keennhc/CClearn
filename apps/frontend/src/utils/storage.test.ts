import { afterEach, describe, expect, it } from 'vitest';
import { clearToken, getToken, setToken } from './storage';

afterEach(() => {
  localStorage.clear();
});

describe('storage', () => {
  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    setToken('my-token');
    expect(getToken()).toBe('my-token');
  });

  it('removes the token on clearToken', () => {
    setToken('my-token');
    clearToken();
    expect(getToken()).toBeNull();
  });
});
