import clsx from 'clsx';
import { Bell, BookOpenCheck, CalendarClock, FileCheck2, NotebookPen, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDismiss } from '@/hooks/useDismiss';
import { useInterval } from '@/hooks/useInterval';
import { notificationService } from '@/services/notificationService';
import type { NotificationItem, UserRole } from '@/types';
import { isAbortError } from '@/utils/errorHandling';
import { Spinner } from '../ui/Spinner';
import { RelativeTime } from './RelativeTime';

const KIND_ICON = { exam: BookOpenCheck, assignment: NotebookPen, result: FileCheck2, system: Settings2, meeting: CalendarClock };
const REFRESH_MS = 60_000;
/** Only in-app paths are followed (never full URLs from the server). */
const safeLink = (link?: string | null) => (link && link.startsWith('/') && !link.startsWith('//') && !link.startsWith('/\\') ? link : null);

export function NotificationMenu({ role }: { role: UserRole }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  useEffect(() => {
    const controller = new AbortController();
    setItems(null);
    setFailed(false);
    notificationService
      .list(role, controller.signal)
      .then(setItems)
      .catch((error: unknown) => {
        if (!isAbortError(error)) setFailed(true);
      });
    return () => controller.abort();
  }, [role]);

  // Quiet refresh while the tab is visible, so new notifications appear without reloading the page.
  useInterval(() => {
    notificationService
      .list(role)
      .then((next) => {
        setItems(next);
        setFailed(false);
      })
      .catch(() => undefined);
  }, REFRESH_MS);

  const textOf = (n: NotificationItem) => (n.titleKey && i18n.exists(n.titleKey) ? t(n.titleKey, n.params) : (n.title ?? ''));
  const openItem = (n: NotificationItem) => {
    const link = safeLink(n.link);
    if (!n.read) {
      setItems((list) => list?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null);
      void notificationService.markRead(n.id).catch(() => undefined);
    }
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  const unread = items?.filter((n) => !n.read).length ?? 0;

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setItems((list) => list?.map((n) => ({ ...n, read: true })) ?? null);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${t('header.notifications')}${unread ? ` — ${t('header.unreadCount', { count: unread })}` : ''}`}
        className="relative flex h-12 w-12 items-center justify-center rounded-[14px] border border-border bg-surface text-foreground shadow-card transition-colors hover:border-primary/40 hover:text-accent-ink aria-expanded:border-primary/50 aria-expanded:text-accent-ink"
      >
        <Bell className="h-[21px] w-[21px]" aria-hidden />
        {unread > 0 && (
          <span aria-hidden className="absolute right-2.5 top-2.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground ring-2 ring-surface">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(380px,calc(100vw-24px))] animate-pop-in overflow-hidden rounded-[18px] border border-border bg-surface-elevated shadow-pop">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="flex items-center gap-2 font-display text-[16px] font-semibold">
              {t('header.notifications')}
              {unread > 0 && <span className="rounded-full bg-accent-soft px-2 py-0.5 font-sans text-[12px] font-semibold text-accent-ink">{unread}</span>}
            </p>
            {unread > 0 && (
              <button type="button" onClick={() => void markAllRead()} className="text-[13px] font-semibold text-accent-ink hover:underline">
                {t('header.markAllRead')}
              </button>
            )}
          </div>
          <ul className="max-h-[360px] overflow-y-auto py-1">
            {!items && !failed && (
              <li className="flex justify-center py-6 text-muted-foreground">
                <Spinner />
              </li>
            )}
            {failed && <li className="px-4 py-6 text-center text-sm text-muted-foreground">{t('errors.network')}</li>}
            {items?.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">{t('header.noNotifications')}</li>}
            {items?.map((n) => {
              const Icon = KIND_ICON[n.kind] ?? Settings2;
              const content = (
                <>
                  <span className={clsx('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]', !n.read ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.06] text-muted-foreground')}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={clsx('block text-sm leading-snug', !n.read ? 'font-semibold text-foreground' : 'text-foreground')}>{textOf(n)}</span>
                    <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
                      <RelativeTime iso={n.createdAt} />
                    </span>
                  </span>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />}
                </>
              );
              return (
                <li key={n.id} className={clsx(!n.read && 'bg-accent-soft/60')}>
                  {safeLink(n.link) || !n.read ? (
                    <button type="button" onClick={() => openItem(n)} className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent-soft">
                      {content}
                    </button>
                  ) : (
                    <div className="flex gap-3 px-4 py-3">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
