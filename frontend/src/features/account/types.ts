import type { SupportRequest, UserRole } from '@/types';

/** The signed-in user's own profile. Name, e-mail, role and class are managed by the school administrator. */
export interface AccountProfile {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  /** Profile photo (https URL or server path); initials without it. */
  avatarUrl?: string | null;
  phone: string;
  about: string;
  institution: string;
  /** Students only. */
  className: string | null;
  schoolNumber: string | null;
  /** Teachers only. */
  subjects: string[];
  classes: string[];
  memberSince: string;
  lastLoginAt: string;
}

export type ProfileUpdate = Pick<AccountProfile, 'phone' | 'about'>;

export const NOTIFICATION_TOPICS = ['announcements', 'messages', 'deadlines', 'results', 'meetings', 'weeklySummary'] as const;
export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[number];

export interface NotificationPrefs {
  email: boolean;
  topics: Record<NotificationTopic, boolean>;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

export type HelpRequestInput = Pick<SupportRequest, 'subject' | 'category' | 'priority'> & { message: string };
