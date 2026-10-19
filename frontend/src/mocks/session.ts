import { STORAGE_KEYS } from '@/config/constants';
import type { User } from '@/types';
import { readStorage } from '@/utils/storage';
import { DEMO_USERS } from './mockUsers';

/** Mock mode only: the demo user of this browser session (the real backend uses the session cookie). */
export function currentDemoUser(): User {
  const id = readStorage(STORAGE_KEYS.demoSession, 'session') ?? readStorage(STORAGE_KEYS.demoSession, 'local');
  return Object.values(DEMO_USERS).find((u) => u.id === id) ?? DEMO_USERS.student;
}

export function isHighSchoolDemo(): boolean {
  return currentDemoUser().level === 'high';
}
