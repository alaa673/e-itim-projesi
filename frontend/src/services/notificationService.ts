import { IS_MOCK_MODE } from '@/config/constants';
import { mockDelay } from '@/mocks/utils';
import type { NotificationItem, UserRole } from '@/types';
import { api } from './api';
import { ENDPOINTS } from './endpoints';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const MOCK_NOTIFICATIONS: Record<UserRole, NotificationItem[]> = {
  admin: [
    { id: 'n-a1', kind: 'system', titleKey: 'notifications.fileProcessed', params: { file: 'TYT_2025_temel_matematik.pdf' }, createdAt: minutesAgo(50), link: '/admin/exam-archive/review', read: false },
    { id: 'n-a2', kind: 'meeting', titleKey: 'notifications.meetingScheduled', createdAt: minutesAgo(300), read: true },
  ],
  teacher: [
    { id: 'n-t1', kind: 'result', titleKey: 'notifications.resultReady', params: { exam: '8-B · 2. Ünite' }, createdAt: minutesAgo(35), link: '/teacher/results', read: false },
    { id: 'n-t2', kind: 'exam', titleKey: 'notifications.examAssigned', params: { subject: 'Cebir', className: '7-A' }, createdAt: minutesAgo(140), link: '/teacher/exams', read: false },
    { id: 'n-t3', kind: 'meeting', titleKey: 'notifications.meetingScheduled', createdAt: minutesAgo(600), link: '/teacher/meetings', read: true },
  ],
  student: [
    { id: 'n-s1', kind: 'assignment', titleKey: 'notifications.supportSent', params: { topic: 'Trigonometri' }, createdAt: minutesAgo(20), link: '/student/support', read: false },
    { id: 'n-s2', kind: 'assignment', titleKey: 'notifications.assignmentDue', params: { title: 'Fizik', days: 1 }, createdAt: minutesAgo(180), link: '/student/assignments', read: false },
    { id: 'n-s3', kind: 'result', titleKey: 'notifications.resultReady', params: { exam: 'Gazlar quiz' }, createdAt: minutesAgo(1500), link: '/student/results', read: true },
  ],
};

export const notificationService = {
  list(role: UserRole, signal?: AbortSignal): Promise<NotificationItem[]> {
    if (IS_MOCK_MODE) return mockDelay(() => MOCK_NOTIFICATIONS[role].map((n) => ({ ...n })), signal, 250);
    return api.get<NotificationItem[]>(ENDPOINTS.notifications, { signal });
  },

  markRead(id: string): Promise<void> {
    if (IS_MOCK_MODE) return mockDelay(() => undefined, undefined, 100);
    return api.post<void>(`${ENDPOINTS.notifications}/${encodeURIComponent(id)}/read`);
  },

  markAllRead(): Promise<void> {
    if (IS_MOCK_MODE) return mockDelay(() => undefined, undefined, 150);
    return api.post<void>(`${ENDPOINTS.notifications}/read-all`);
  },
};
