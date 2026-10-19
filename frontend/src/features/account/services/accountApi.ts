/**
 * "Me" endpoints shared by all roles (provisional contracts — see docs/BACKEND_API_REQUIREMENTS.md).
 * The server identifies the user from the session cookie; no user id is ever sent from here.
 */
import { nextId } from '@/mocks/collection';
import { mockDelay } from '@/mocks/utils';
import { api } from '@/services/api';
import { mockOr } from '@/services/resource';
import type { SupportRequest } from '@/types';
import { ApiError } from '@/utils/errorHandling';
import type { AccountProfile, HelpRequestInput, NotificationPrefs, PasswordChange, ProfileUpdate } from '../types';

const account = () => import('@/mocks/db/account');
const comms = () => import('@/mocks/db/comms');

export const profileApi = {
  get(signal?: AbortSignal): Promise<AccountProfile> {
    return mockOr(
      () => api.get<AccountProfile>('/me/profile', { signal }),
      async () => {
        const { profileOfCurrentUser } = await account();
        return mockDelay(() => structuredClone(profileOfCurrentUser()), signal);
      },
    );
  },
  update(change: ProfileUpdate): Promise<AccountProfile> {
    return mockOr(
      () => api.patch<AccountProfile>('/me/profile', change),
      async () => {
        const { saveProfile } = await account();
        return mockDelay(() => structuredClone(saveProfile(change)), undefined, 450);
      },
    );
  },
};

/**
 * Production: the server verifies the current password, enforces the password policy and
 * invalidates other sessions. Demo: nothing is changed — the demo password stays the same.
 */
export function changePassword(input: PasswordChange): Promise<void> {
  return mockOr(
    () => api.post<void>('/me/password', input),
    async () => {
      const { DEMO_PASSWORD } = await import('@/mocks/mockUsers');
      return mockDelay(() => {
        if (input.currentPassword !== DEMO_PASSWORD) throw new ApiError('validation', { status: 422, fieldErrors: { currentPassword: 'wrongPassword' } });
      }, undefined, 600);
    },
  );
}

export const notificationPrefsApi = {
  get(signal?: AbortSignal): Promise<NotificationPrefs> {
    return mockOr(
      () => api.get<NotificationPrefs>('/me/notification-preferences', { signal }),
      async () => {
        const { prefsOfCurrentUser } = await account();
        return mockDelay(() => structuredClone(prefsOfCurrentUser()), signal);
      },
    );
  },
  save(value: NotificationPrefs): Promise<NotificationPrefs> {
    return mockOr(
      () => api.put<NotificationPrefs>('/me/notification-preferences', value),
      async () => {
        const { savePrefs } = await account();
        return mockDelay(() => savePrefs(value), undefined, 450);
      },
    );
  },
};

/** Help requests: teachers and students write to the school administrator (Destek talepleri). */
export const helpRequestApi = {
  mine(signal?: AbortSignal): Promise<SupportRequest[]> {
    return mockOr(
      () => api.get<SupportRequest[]>('/support-requests/mine', { signal }),
      async () => {
        const [{ supportRequests }, { profileOfCurrentUser }] = await Promise.all([comms(), account()]);
        const me = profileOfCurrentUser();
        const name = `${me.firstName} ${me.lastName}`;
        return mockDelay(
          () =>
            supportRequests
              .all()
              .filter((r) => r.requester === name)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((r) => structuredClone(r)),
          signal,
        );
      },
    );
  },
  create(input: HelpRequestInput): Promise<SupportRequest> {
    return mockOr(
      () => api.post<SupportRequest>('/support-requests', input),
      async () => {
        const [{ supportRequests }, { profileOfCurrentUser }] = await Promise.all([comms(), account()]);
        const me = profileOfCurrentUser();
        const name = `${me.firstName} ${me.lastName}`;
        const now = new Date().toISOString();
        const role = me.role === 'teacher' ? 'teacher' : 'student';
        return supportRequests.insert({
          id: nextId('sr'),
          subject: input.subject,
          category: input.category,
          priority: input.priority,
          requester: name,
          requesterRole: role,
          status: 'open',
          createdAt: now,
          messages: [{ id: nextId('m'), from: name, fromRole: role, text: input.message, at: now }],
        });
      },
    );
  },
};
