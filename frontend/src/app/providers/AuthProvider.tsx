import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onUnauthorized } from '@/services/api';
import { authService } from '@/services/authService';
import type { DemoProfile, Session } from '@/types';
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext';
import type { LoginCredentials } from '@/types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [sessionExpired, setSessionExpired] = useState(false);
  const statusRef = useRef<AuthStatus>('restoring');
  statusRef.current = status;

  useEffect(() => {
    const controller = new AbortController();
    authService
      .restoreSession(controller.signal)
      .then((restored) => {
        if (controller.signal.aborted) return;
        setSession(restored);
        setStatus(restored ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('anonymous');
      });
    return () => controller.abort();
  }, []);

  const clearSession = useCallback(() => {
    // Drop in-memory user data; page-level data lives in unmounted components and is released with them.
    setSession(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    onUnauthorized(() => {
      // A 401 while signed in means the server ended the session (expiry, password reset elsewhere…).
      if (statusRef.current === 'authenticated') setSessionExpired(true);
      clearSession();
    });
    return () => onUnauthorized(null);
  }, [clearSession]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const next = await authService.login(credentials);
    setSessionExpired(false);
    setSession(next);
    setStatus('authenticated');
    return next.user;
  }, []);

  const loginAsDemo = useCallback(async (profile: DemoProfile) => {
    const next = await authService.loginAsDemo(profile);
    setSessionExpired(false);
    setSession(next);
    setStatus('authenticated');
    return next.user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setSessionExpired(false);
    clearSession();
  }, [clearSession]);

  const passwordChanged = useCallback(() => {
    setSession((prev) => (prev ? { ...prev, user: { ...prev.user, mustChangePassword: false } } : prev));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      isDemo: session?.isDemo ?? false,
      sessionExpired,
      login,
      loginAsDemo,
      logout,
      passwordChanged,
    }),
    [status, session, sessionExpired, login, loginAsDemo, logout, passwordChanged],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

