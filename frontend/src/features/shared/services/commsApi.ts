/**
 * Announcements, calendar, meetings and messages for all roles (provisional contracts).
 * The server decides what each user may see (role, level, class) — the filters sent from here
 * only narrow the view and are never trusted for authorisation.
 */
import { nextId } from '@/mocks/collection';
import { mockDelay } from '@/mocks/utils';
import { api } from '@/services/api';
import { createResourceService, mockOr } from '@/services/resource';
import type { Announcement, CalendarEvent, Conversation, Meeting, PaginatedResponse, UserRole } from '@/types';
import type { ListQuery } from '@/types';

const comms = () => import('@/mocks/db/comms');

export interface AnnouncementInput {
  title: string;
  body: string;
  audience: string;
  audienceLabel: string;
  status: Announcement['status'];
  pinned: boolean;
  publishedAt: string;
  author: string;
  authorRole: 'admin' | 'teacher';
}

export const announcementApi = createResourceService<Announcement, AnnouncementInput>('/announcements', () => comms().then((m) => m.announcements), {
  create: (input) => ({ ...input, id: nextId('an') }),
});

export function calendarApi(role: UserRole) {
  return {
    list(query: Omit<ListQuery, 'offset' | 'limit'> & Partial<Pick<ListQuery, 'offset' | 'limit'>>, signal?: AbortSignal): Promise<PaginatedResponse<CalendarEvent>> {
      const q = { offset: 0, limit: 500, ...query };
      return mockOr(
        () => api.get<PaginatedResponse<CalendarEvent>>(`/${role}/calendar`, { signal, query: { offset: q.offset, limit: q.limit, search: q.search } }),
        async () => (await comms()).calendarOf(role).list(q, signal),
      );
    },
    create(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
      return mockOr(
        () => api.post<CalendarEvent>(`/${role}/calendar`, event),
        async () => (await comms()).calendarOf(role).insert({ ...event, id: nextId('ev') }),
      );
    },
    remove(id: string): Promise<void> {
      return mockOr(
        () => api.delete<void>(`/${role}/calendar/${encodeURIComponent(id)}`),
        async () => (await comms()).calendarOf(role).remove(id),
      );
    },
  };
}

export function meetingApi(role: UserRole) {
  return createResourceService<Meeting, Omit<Meeting, 'id'>>(`/${role}/meetings`, () => comms().then((m) => m.meetingsOf(role)), {
    create: (input) => ({ ...input, id: nextId('mt') }),
  });
}

export function messageApi(role: UserRole) {
  return {
    ...createResourceService<Conversation, Pick<Conversation, 'name' | 'subtitle'>>(`/${role}/conversations`, () => comms().then((m) => m.conversationsOf(role)), {
      create: (input) => ({ ...input, id: nextId('cv'), unread: 0, updatedAt: new Date().toISOString(), messages: [] }),
    }),
    send(conversationId: string, text: string): Promise<Conversation> {
      return mockOr(
        () => api.post<Conversation>(`/${role}/conversations/${encodeURIComponent(conversationId)}/messages`, { text }),
        async () => {
          const store = (await comms()).conversationsOf(role);
          const current = store.find(conversationId);
          const at = new Date().toISOString();
          return store.patch(conversationId, { messages: [...(current?.messages ?? []), { id: nextId('msg'), mine: true, text, at }], updatedAt: at, unread: 0 });
        },
      );
    },
    markRead(conversationId: string): Promise<Conversation> {
      return mockOr(
        () => api.post<Conversation>(`/${role}/conversations/${encodeURIComponent(conversationId)}/read`),
        async () => (await comms()).conversationsOf(role).patch(conversationId, { unread: 0 }),
      );
    },
  };
}

/** People the current user may start a conversation with (server-filtered in production). */
export function contactsApi(role: UserRole, signal?: AbortSignal): Promise<{ name: string; subtitle: string }[]> {
  return mockOr(
    () => api.get<{ name: string; subtitle: string }[]>(`/${role}/contacts`, { signal }),
    async () => {
      if (role === 'teacher') {
        const { rosterOf, fullName } = await import('@/mocks/mockStudents');
        return mockDelay(() => ['8-A', '8-B'].flatMap((cls) => rosterOf(cls).slice(0, 12).map((s) => ({ name: fullName(s), subtitle: cls }))), signal, 150);
      }
      const { isHighSchoolDemo } = await import('@/mocks/session');
      return mockDelay(
        () =>
          isHighSchoolDemo()
            ? [
                { name: 'Kaan Yıldırım', subtitle: 'Matematik öğretmeni' },
                { name: 'Tuana Aslan', subtitle: 'Fizik öğretmeni' },
                { name: 'Hira Kurt', subtitle: 'Kimya öğretmeni' },
                { name: 'Rehberlik Servisi', subtitle: 'Rehber öğretmen' },
              ]
            : [
                { name: 'Ayşe Yılmaz', subtitle: 'Matematik öğretmeni' },
                { name: 'Selin Aksoy', subtitle: 'Fen Bilimleri öğretmeni' },
                { name: 'Burak Tekin', subtitle: 'Türkçe öğretmeni' },
                { name: 'Rehberlik Servisi', subtitle: 'Rehber öğretmen' },
              ],
        signal,
        150,
      );
    },
  );
}
