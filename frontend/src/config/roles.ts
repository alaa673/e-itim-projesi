import { GraduationCap, type LucideIcon, Presentation, ShieldCheck } from 'lucide-react';
import type { UserRole } from '@/types';

export const ROLES: readonly UserRole[] = ['admin', 'teacher', 'student'];

/** Landing page for each role after sign-in. */
export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
};

export const ROLE_PREFIX: Record<UserRole, string> = {
  admin: '/admin',
  teacher: '/teacher',
  student: '/student',
};

/** Icon used wherever a role is shown (login demo tiles, sidebar role card). */
export const ROLE_ICON: Record<UserRole, LucideIcon> = {
  admin: ShieldCheck,
  teacher: Presentation,
  student: GraduationCap,
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
