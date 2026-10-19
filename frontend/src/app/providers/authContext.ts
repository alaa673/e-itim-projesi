import { createContext, useContext } from 'react';
import type { DemoProfile, LoginCredentials, User } from '@/types';

export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  isDemo: boolean;
  /** True after the server ended the session (401) while the user was signed in; cleared on the next sign-in. */
  sessionExpired: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  loginAsDemo: (profile: DemoProfile) => Promise<User>;
  logout: () => Promise<void>;
  /** Call after POST /me/password succeeds for a user who had to choose a new password. */
  passwordChanged: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
