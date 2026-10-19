import type { DemoProfile, User } from '@/types';

/**
 * DEVELOPMENT-ONLY demo accounts. Used exclusively by the mock auth adapter
 * (VITE_API_MODE=mock). These are not production credentials.
 */
export const DEMO_PASSWORD = 'demo1234';

export const DEMO_USERS: Record<DemoProfile, User> = {
  admin: {
    id: 'u-admin-1',
    username: 'yonetici',
    role: 'admin',
    firstName: 'Hakan',
    lastName: 'Öztürk',
    email: 'yonetici@demo.okul',
  },
  teacher: {
    id: 'u-teacher-1',
    username: 'ogretmen',
    role: 'teacher',
    firstName: 'Ayşe',
    lastName: 'Yılmaz',
    email: 'ogretmen@demo.okul',
    subjects: ['Matematik'],
  },
  student: {
    id: 'u-student-1',
    username: 'ogrenci',
    role: 'student',
    firstName: 'Deniz',
    lastName: 'Kaya',
    email: 'ogrenci@demo.okul',
    level: 'middle',
    grade: 8,
    section: 'A',
  },
  studentHigh: {
    id: 'u-student-2',
    username: 'lise',
    role: 'student',
    firstName: 'Elif',
    lastName: 'Yıldız',
    email: 'lise@demo.okul',
    level: 'high',
    grade: 11,
    section: 'B',
  },
};

/** Demo sign-in accepts the e-mail address or the username. */
export function findDemoUser(identifier: string): User | undefined {
  const normalized = identifier.trim().toLocaleLowerCase('tr-TR');
  return Object.values(DEMO_USERS).find((user) => user.email === normalized || user.username === normalized);
}
