/**
 * Mock "me" endpoints. State lives in memory per demo user and is lost on reload —
 * the UI says so ("demo.notPersisted") whenever something is saved here.
 */
import type { AccountProfile, NotificationPrefs } from '@/features/account/types';
import { currentDemoUser } from '../session';
import { relativeDate } from '../utils';

const profiles = new Map<string, AccountProfile>();
const prefs = new Map<string, NotificationPrefs>();

export function profileOfCurrentUser(): AccountProfile {
  const u = currentDemoUser();
  let p = profiles.get(u.id);
  if (!p) {
    p = {
      id: u.id,
      role: u.role,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: '',
      about: '',
      institution: 'Demo Okulu',
      className: u.role === 'student' ? `${u.grade}-${u.section}` : null,
      schoolNumber: u.role === 'student' ? (u.level === 'high' ? '1127' : '845') : null,
      subjects: u.subjects ?? [],
      classes: u.role === 'teacher' ? ['8-A', '8-B', '7-A', '7-C', '6-B', '5-A'] : [],
      memberSince: relativeDate(-400, 9, 0),
      lastLoginAt: relativeDate(-1, 18, 42),
    };
    profiles.set(u.id, p);
  }
  return p;
}

export function saveProfile(change: Pick<AccountProfile, 'phone' | 'about'>): AccountProfile {
  const next = { ...profileOfCurrentUser(), ...change };
  profiles.set(next.id, next);
  return next;
}

export function prefsOfCurrentUser(): NotificationPrefs {
  const u = currentDemoUser();
  let p = prefs.get(u.id);
  if (!p) {
    p = {
      email: u.role !== 'student',
      topics: { announcements: true, messages: true, deadlines: true, results: u.role === 'student', meetings: true, weeklySummary: u.role !== 'admin' },
    };
    prefs.set(u.id, p);
  }
  return p;
}

export function savePrefs(value: NotificationPrefs): NotificationPrefs {
  prefs.set(currentDemoUser().id, structuredClone(value));
  return structuredClone(value);
}
