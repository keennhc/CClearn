import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, CommunityMemberRole } from '@home-owners-hub/shared-types';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../../../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from '../../../services/api';

const mockGet = api.get as ReturnType<typeof vi.fn>;

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

const mockProfile = {
  id: 'user-1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: UserRole.SUPER_ADMIN,
  profileImageUrl: null,
  communities: [],
};

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

describe('AuthContext', () => {
  it('starts unauthenticated when no token in storage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('authenticates after login is called', async () => {
    mockGet.mockResolvedValueOnce({
      data: { success: true, data: mockProfile },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login(makeToken(UserRole.SUPER_ADMIN));
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('admin@example.com');
  });

  it('sets isSuperAdmin when user role is SUPER_ADMIN', async () => {
    mockGet.mockResolvedValueOnce({
      data: { success: true, data: mockProfile },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login(makeToken(UserRole.SUPER_ADMIN));
    });

    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.isCommunityAdmin).toBe(false);
  });

  it('sets isCommunityAdmin when user has admin membership', async () => {
    const communityAdminProfile = {
      ...mockProfile,
      role: UserRole.USER,
      communities: [{ communityId: 'c-1', communityName: 'Test', role: CommunityMemberRole.COMMUNITY_ADMIN }],
    };
    mockGet.mockResolvedValueOnce({
      data: { success: true, data: communityAdminProfile },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login(makeToken(UserRole.USER));
    });

    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.isCommunityAdmin).toBe(true);
    expect(result.current.activeCommunityId).toBe('c-1'); // communityId field
  });

  it('clears user on logout', async () => {
    mockGet.mockResolvedValueOnce({
      data: { success: true, data: mockProfile },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login(makeToken(UserRole.SUPER_ADMIN));
    });
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    );
  });
});
