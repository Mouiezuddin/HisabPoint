import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, AuthTokens } from '../../types';
import { clearTokens } from '../../utils/auth';
import { authService } from '../../services/auth.service';

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthTokens>;
  verify2FA: (preAuthToken: string, code: string) => Promise<AuthTokens>;
  loginWithGoogle: (googleToken: string) => Promise<AuthTokens>;
  register: (data: { email: string; name: string; phone?: string; password: string; password2: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('ledger_user_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    const token = localStorage.getItem('ledger_access_token');
    const cached = localStorage.getItem('ledger_user_cache');
    // If we have both token and cached profile, render immediately!
    if (token && cached) return false;
    // If no token, user is unauthenticated, no blocking needed
    if (!token) return false;
    return true;
  });

  const saveUser = useCallback((u: User | null) => {
    setUser(u);
    if (u) {
      try {
        localStorage.setItem('ledger_user_cache', JSON.stringify(u));
      } catch {}
    } else {
      localStorage.removeItem('ledger_user_cache');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      saveUser(profile);
    } catch {
      clearTokens();
      saveUser(null);
    }
  }, [saveUser]);

  // On mount, verify profile in background without freezing UI
  useEffect(() => {
    const token = localStorage.getItem('ledger_access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    if (res.access) {
      localStorage.setItem('ledger_access_token', res.access);
    }
    if (res.refresh) {
      localStorage.setItem('ledger_refresh_token', res.refresh);
    }
    if (res.user) {
      saveUser(res.user);
    }
    return res;
  }, [saveUser]);

  const verify2FA = useCallback(async (preAuthToken: string, code: string) => {
    const res = await authService.verify2FA(preAuthToken, code);
    if (res.access) {
      localStorage.setItem('ledger_access_token', res.access);
    }
    if (res.refresh) {
      localStorage.setItem('ledger_refresh_token', res.refresh);
    }
    if (res.user) {
      saveUser(res.user);
    }
    return res;
  }, [saveUser]);

  const loginWithGoogle = useCallback(async (googleToken: string) => {
    const res = await authService.googleAuth(googleToken);
    if (res.access) {
      localStorage.setItem('ledger_access_token', res.access);
    }
    if (res.refresh) {
      localStorage.setItem('ledger_refresh_token', res.refresh);
    }
    if (res.user) {
      saveUser(res.user);
    }
    return res;
  }, [saveUser]);

  const register = useCallback(async (data: { email: string; name: string; phone?: string; password: string; password2: string }) => {
    const result = await authService.register(data);
    if (result.access) {
      localStorage.setItem('ledger_access_token', result.access);
    }
    if (result.refresh) {
      localStorage.setItem('ledger_refresh_token', result.refresh);
    }
    if (result.user) {
      saveUser(result.user);
    }
  }, [saveUser]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      clearTokens();
      saveUser(null);
    }
  }, [saveUser]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, verify2FA, loginWithGoogle, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
