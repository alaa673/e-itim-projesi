import { IS_MOCK_MODE, STORAGE_KEYS } from '@/config/constants';
import { isUserRole } from '@/config/roles';
import type { DemoProfile, LoginCredentials, Session, User } from '@/types';
import { ApiError } from '@/utils/errorHandling';
import { readStorage, removeStorage, writeStorage } from '@/utils/storage';
import { api } from './api';
import { ENDPOINTS } from './endpoints';

/**
 * Authentication abstraction.
 * - real mode: the backend sets an httpOnly session cookie; the frontend never stores tokens.
 * - mock mode: DEVELOPMENT-ONLY demo sign-in. Only the demo user id is kept in sessionStorage and
 *   resolved back to a demo record; it is never treated as proof of authorization.
 */
/** Demo accounts are loaded only in mock mode, so a real build never contains them. */
const demo = async () => {
  const [users, utils] = await Promise.all([import('@/mocks/mockUsers'), import('@/mocks/utils')]);
  return { ...users, mockDelay: utils.mockDelay };
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<Session> {
    if (IS_MOCK_MODE) {
      const { findDemoUser, DEMO_PASSWORD, mockDelay } = await demo();
      const user = await mockDelay(() => findDemoUser(credentials.identifier), undefined, 650);
      if (!user || credentials.password !== DEMO_PASSWORD) {
        throw new ApiError('unauthorized', { status: 401, message: 'invalid_credentials' });
      }
      // "Remember me": keep the demo session across browser restarts (localStorage) instead of this tab only.
      writeStorage(STORAGE_KEYS.demoSession, user.id, credentials.remember ? 'local' : 'session');
      return { user, isDemo: true };
    }
    const user = await api.post<User>(ENDPOINTS.auth.login, credentials);
    return { user, isDemo: false };
  },

  /** Mock mode only: one-click demo sign-in for presentations. */
  async loginAsDemo(profile: DemoProfile): Promise<Session> {
    if (!IS_MOCK_MODE) throw new ApiError('forbidden');
    const { DEMO_USERS, mockDelay } = await demo();
    const user = await mockDelay(() => DEMO_USERS[profile], undefined, 350);
    writeStorage(STORAGE_KEYS.demoSession, user.id, 'session');
    return { user, isDemo: true };
  },

  async restoreSession(signal?: AbortSignal): Promise<Session | null> {
    if (IS_MOCK_MODE) {
      const { DEMO_USERS } = await demo();
      const id = readStorage(STORAGE_KEYS.demoSession, 'session') ?? readStorage(STORAGE_KEYS.demoSession, 'local');
      const user = Object.values(DEMO_USERS).find((u) => u.id === id);
      return user ? { user, isDemo: true } : null;
    }
    try {
      const user = await api.get<User>(ENDPOINTS.auth.me, { signal });
      if (!user || !isUserRole(user.role)) return null;
      return { user, isDemo: false };
    } catch (error) {
      if (error instanceof ApiError && (error.kind === 'unauthorized' || error.kind === 'forbidden')) return null;
      throw error;
    }
  },

  async logout(): Promise<void> {
    removeStorage(STORAGE_KEYS.demoSession, 'session');
    removeStorage(STORAGE_KEYS.demoSession, 'local');
    if (!IS_MOCK_MODE) {
      try {
        await api.post<void>(ENDPOINTS.auth.logout);
      } catch {
        /* the local session is cleared regardless */
      }
    }
  },
};
