import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { UserRole } from '@home-owners-hub/shared-types';
import { decodeToken, isTokenExpired } from '../../../utils/jwt';
import { clearToken, getToken, setToken } from '../../../utils/storage';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function userFromToken(token: string | null): AuthUser | null {
  if (!token) {
    return null;
  }

  const payload = decodeToken(token);
  if (!payload || isTokenExpired(payload)) {
    return null;
  }

  return { id: payload.sub, email: payload.email, role: payload.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => userFromToken(getToken()));

  const login = (token: string) => {
    setToken(token);
    setUser(userFromToken(token));
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === UserRole.ADMIN,
      login,
      logout,
    }),
    [user],
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
