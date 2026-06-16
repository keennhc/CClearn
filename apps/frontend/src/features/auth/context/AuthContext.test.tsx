import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { UserRole } from '@home-owners-hub/shared-types';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';

afterEach(() => {
  localStorage.clear();
});

function makeToken(role: UserRole, expired = false): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: 'user-1',
    email: 'admin@example.com',
    role,
    iat: now - 60,
    exp: expired ? now - 1 : now + 3600,
  };
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  it('starts unauthenticated when no token in storage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('authenticates after login is called', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(makeToken(UserRole.ADMIN));
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('admin@example.com');
  });

  it('sets isAdmin when user role is ADMIN', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(makeToken(UserRole.ADMIN));
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it('does not set isAdmin when user role is USER', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(makeToken(UserRole.USER));
    });

    expect(result.current.isAdmin).toBe(false);
  });

  it('clears user on logout', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(makeToken(UserRole.ADMIN));
    });
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('does not authenticate with an expired token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(makeToken(UserRole.ADMIN, true));
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    );
  });
});
