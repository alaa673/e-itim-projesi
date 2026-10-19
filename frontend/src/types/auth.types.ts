import type { SchoolLevel } from './common.types';

export type UserRole = 'admin' | 'teacher' | 'student';

/** Demo sign-in profiles (mock mode only): the three roles plus a high-school student. */
export type DemoProfile = UserRole | 'studentHigh';

export interface User {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  /** Optional sign-in name (e.g. a school number); users may sign in with it or with the e-mail. */
  username?: string;
  /** Profile photo (https URL or server path). Initials are shown without it. */
  avatarUrl?: string | null;
  /**
   * Set by the server for accounts created or reset by an administrator: the user must choose a new
   * password before using the app. Cleared by the server after POST /me/password succeeds.
   */
  mustChangePassword?: boolean;
  /** Only for students: used to tailor navigation (e.g. no university tools for primary school). */
  level?: SchoolLevel;
  grade?: number;
  section?: string;
  /** Only for teachers. */
  subjects?: string[];
}

export interface LoginCredentials {
  /** Username or e-mail address, exactly as typed (trimmed). */
  identifier: string;
  password: string;
  /** Keep the session after the browser is closed (the backend decides the cookie lifetime). */
  remember?: boolean;
}

export interface Session {
  user: User;
  /** True when the session was created by the development-only mock adapter. */
  isDemo: boolean;
}
