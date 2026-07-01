import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthProfile, CommunityMemberRole, UserRole } from '@home-owners-hub/shared-types';
import { decodeToken, isTokenExpired } from '../../../utils/jwt';
import { clearToken, getToken, setToken } from '../../../utils/storage';
import { queryClient } from '../../../services/queryClient';
import { api } from '../../../services/api';
import { unwrap } from '../../../services/unwrap';

interface AuthContextValue {
  user: AuthProfile | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isCommunityAdmin: boolean;
  activeCommunityId: string | null;
  setActiveCommunity: (id: string) => void;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const ACTIVE_COMMUNITY_KEY = 'activeCommunityId';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function hasValidToken(): boolean {
  const token = getToken();
  if (!token) return false;
  const payload = decodeToken(token);
  return payload !== null && !isTokenExpired(payload);
}

async function fetchProfile(): Promise<AuthProfile> {
  const res = await api.get('/auth/me');
  return unwrap(res);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(() => hasValidToken());

  useEffect(() => {
    if (!hasValidToken()) return;
    fetchProfile()
      .then(setUser)
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const [activeCommunityId, setActiveCommunityIdState] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_COMMUNITY_KEY),
  );

  const adminCommunities = useMemo(
    () => user?.communities.filter((c) => c.role === CommunityMemberRole.COMMUNITY_ADMIN) ?? [],
    [user],
  );

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isCommunityAdmin = adminCommunities.length > 0;

  useEffect(() => {
    if (!user || isSuperAdmin) return;
    if (adminCommunities.length === 0) return;

    const stored = localStorage.getItem(ACTIVE_COMMUNITY_KEY);
    const valid = adminCommunities.find((c) => c.communityId === stored);
    if (!valid) {
      const first = adminCommunities[0].communityId;
      localStorage.setItem(ACTIVE_COMMUNITY_KEY, first);
      setActiveCommunityIdState(first);
    }
  }, [user, isSuperAdmin, adminCommunities]);

  const setActiveCommunity = useCallback((id: string) => {
    localStorage.setItem(ACTIVE_COMMUNITY_KEY, id);
    setActiveCommunityIdState(id);
  }, []);

  const login = useCallback(async (token: string) => {
    setToken(token);
    setLoading(true);
    try {
      const profile = await fetchProfile();
      setUser(profile);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(ACTIVE_COMMUNITY_KEY);
    setUser(null);
    setActiveCommunityIdState(null);
    queryClient.clear();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isSuperAdmin,
      isCommunityAdmin,
      activeCommunityId: isSuperAdmin ? null : activeCommunityId,
      setActiveCommunity,
      loading,
      login,
      logout,
    }),
    [user, isSuperAdmin, isCommunityAdmin, activeCommunityId, setActiveCommunity, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
