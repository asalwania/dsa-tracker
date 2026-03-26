'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type ReactElement,
} from 'react';
import { api, setAccessToken } from '@/lib/axios';
import type { User, AuthResponse } from '@/types';

/** Shape of the authentication context value */
interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provides authentication state and methods to the component tree.
 * On mount, attempts a silent token refresh to restore session.
 */
export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  /**
   * Attempts to refresh the access token using the HTTP-only cookie.
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const response = await api.post<{ data: AuthResponse }>('/auth/refresh');
      const { user: userData, accessToken: newToken } = response.data.data;
      setUser(userData);
      setToken(newToken);
      setAccessToken(newToken);
    } catch {
      setUser(null);
      setToken(null);
      setAccessToken(null);
    }
  }, []);

  /**
   * Authenticates with email and password.
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const response = await api.post<{ data: AuthResponse }>('/auth/login', {
      email,
      password,
    });
    const { user: userData, accessToken: newToken } = response.data.data;
    setUser(userData);
    setToken(newToken);
    setAccessToken(newToken);
  }, []);

  /**
   * Registers a new user account.
   */
  const register = useCallback(
    async (data: { name: string; email: string; password: string }): Promise<void> => {
      const response = await api.post<{ data: AuthResponse }>('/auth/register', data);
      const { user: userData, accessToken: newToken } = response.data.data;
      setUser(userData);
      setToken(newToken);
      setAccessToken(newToken);
    },
    [],
  );

  /**
   * Logs out the current user by clearing tokens and calling the logout endpoint.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors — clear local state regardless
    } finally {
      setUser(null);
      setToken(null);
      setAccessToken(null);
    }
  }, []);

  // Attempt silent refresh on mount
  useEffect(() => {
    refreshToken().finally(() => setIsLoading(false));
  }, [refreshToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: token,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the authentication context.
 * Must be used within an AuthProvider.
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
