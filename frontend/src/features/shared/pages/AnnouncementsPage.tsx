import clsx from 'clsx';
import { CalendarClock, Megaphone, Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useAuth } from '@/app/providers/authContext';
import { ListFooter } from '@/components/data/ResourceTable';
import { FormModal } from '@/components/form/FormModal';
import { required } from '@/components/form/validation';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useAction } from '@/hooks/useAction';
import { useListQuery } from '@/hooks/useListQuery';
import { useLocale } from '@/hooks/useLocale';
import { useStateFlag } from '@/hooks/useOpenParam';
import { useResourceList } from '@/hooks/useResourceList';
import type { Announcement, UserRole } from '@/types';
import { formatDate, formatTime } from '@/utils/format';
import { useClassNames } from '../hooks/useClassNames';
import { type AnnouncementInput, announcementApi } from '../services/commsApi';

const STATUS_TONE = { published: 'success', scheduled: 'info', draft: 'neutral' } as const;
type View = 'feed' | 'mine';

const schema = z
  .object({
    title: required(),
    body: required(),
    audience: required(),
    status: z.enum(['published', 'scheduled', 'draft']),
    publishAt: z.string(),
    pinned: z.boolean(),
  })
  .refine((v) => v.status !== 'scheduled' || (v.publishAt && new Date(v.publishAt).getTime() > Date.now()), { path: ['publishAt'], message: 'validation.futureDate' });
type FormValues = z.infer<typeof schema>;

export default function AnnouncementsPage({ role }: { role: UserRole }) {
  const { t } = useTranslation(['shared', 'common']);
  const locale = useLocale();
  const { user } = useAuth();
  const me = user ? `${user.firstName} ${user.lastName}` : '';
  const viewer = `${role}|${user?.level ?? ''}|${user?.grade ? `${user.grade}-${user.section}` : ''}`;
  const [view, setView] = useState<View>(role === 'admin' ? 'mine' : 'feed');
  const lq = useListQuery({ sort: { key: 'publishedAt', direction: 'desc' } });
  const query = useMemo(() => {
    const filters: Record<string, string> = view === 'feed' ? { visibleTo: viewer } : role === 'admin' ? {} : { authorRole: 'teacher', author: me };
    return { ...lq.query, filters };
  }, [lq.query, view, viewer, role, me]);
  const list = useResourceList(announcementApi.list, query);
  const [editing, setEditing] = useState<{ item: Announcement | null } | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { run, busy } = useAction();
  const canWrite = role !== 'student';
  const classNames = useClassNames(role);
  useStateFlag('openCreate', () => canWrite && setEditing({ item: null }));

  const audienceOptions =
    role === 'admin'
      ? [
          ...(['all', 'teachers', 'students', 'primary', 'middle', 'high'] as const).map((v) => ({ value: v, label: t(`announcements.audiences.${v}`) })),
          ...classNames.map((c) => ({ value: c, label: t('announcements.classAudience', { cls: c }) })),
        ]
      : classNames.map((c) => ({ value: c, label: t('announcements.classAudience', { cls: c }) }));
  const labelOf = (audience: string) => audienceOptions.find((o) => o.value === audience)?.label ?? audience;
  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const tabs = role === 'student' ? null : role === 'admin' ? null : (
    <Tabs<View>
      className="mb-4"
      label={t('announcements.viewLabel')}
      value={view}
      onChange={setView}
      items={[
        { value: 'feed', label: t('announcements.views.feed') },
        { value: 'mine', label: t('announcements.views.mine') },
      ]}
    />
  );

  return (
    <>
      <PageHeader
        title={t(`nav.${role}.announcements`, { ns: 'common' })}
        description={t(`announcements.description.${role}`)}
        actions={
          canWrite && (
            <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ item: null })}>
              {t('announcements.add')}
            </Button>
          )
        }
      />
      {tabs}
      <div className="panel mb-4 p-4">
        <Input type="search" label={t('common.search', { ns: 'common' })} placeholder={t('announcements.searchPlaceholder')} value={lq.search} onChange={(e) => lq.setSearch(e.target.value)} />
      </div>

      {list.status === 'error' ? (
        <div className="panel">
          <ErrorState error={list.error} onRetry={list.retry} />
        </div>
      ) : list.status === 'loading' && list.items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-panel" />
          ))}
        </div>
      ) : list.items.length === 0 ? (
        <div className="panel">
          <EmptyState icon={<Megaphone className="h-5 w-5" aria-hidden />} title={lq.active ? t('states.noResults', { ns: 'common' }) : t('announcements.empty')} />
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <ul className="divide-y divide-border">
            {list.items.map((a) => {
              const mine = role === 'admin' || (a.authorRole === 'teacher' && a.author === me);
              const open = expanded === a.id;
              return (
                <li key={a.id} className={clsx('p-5', a.pinned && 'bg-lime-soft/50')}>
                  <article aria-labelledby={`an-${a.id}`}>
                    <div className="flex items-start gap-3">
                      <Avatar name={a.author} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 id={`an-${a.id}`} className="font-display text-[17px] font-extrabold text-foreground">
                            {a.title}
                          </h2>
                          {a.pinned && (
                            <Badge tone="lime" icon={<Pin className="h-3 w-3" aria-hidden />}>
                              {t('announcements.pinned')}
                            </Badge>
                          )}
                          {mine && a.status !== 'published' && (
                            <Badge tone={STATUS_TONE[a.status]} icon={a.status === 'scheduled' ? <CalendarClock className="h-3 w-3" aria-hidden /> : undefined}>
                              {t(`announcements.status.${a.status}`)}
                              {a.status === 'scheduled' && ` · ${formatDate(a.publishedAt, locale, { day: 'numeric', month: 'short' })} ${formatTime(a.publishedAt, locale)}`}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {a.author} · {t(`roles.${a.authorRole}`, { ns: 'common' })} · <RelativeTime iso={a.publishedAt} /> · <span className="font-semibold text-accent-ink">{a.audienceLabel}</span>
                        </p>
                        <p className={clsx('mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-foreground', !open && 'line-clamp-2')}>{a.body}</p>
                        {a.body.length > 140 && (
                          <button type="button" className="link-accent mt-1 text-[13.5px]" aria-expanded={open} onClick={() => setExpanded(open ? null : a.id)}>
                            {open ? t('announcements.less') : t('announcements.more')}
                          </button>
                        )}
                      </div>
                      {mine && canWrite && (
                        <span className="flex shrink-0 gap-1">
                          <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${a.title}`} onClick={() => setEditing({ item: a })} />
                          <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${a.title}`} onClick={() => setDeleting(a)} />
                        </span>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
          <ListFooter list={list} />
        </div>
      )}

      {canWrite && (
        <FormModal<FormValues>
          open={editing !== null}
          size="lg"
          title={editing?.item ? t('announcements.editTitle') : t('announcements.add')}
          schema={schema}
          defaultValues={
            editing?.item
              ? { title: editing.item.title, body: editing.item.body, audience: editing.item.audience, status: editing.item.status, publishAt: toLocalInput(editing.item.publishedAt), pinned: editing.item.pinned }
              : { title: '', body: '', audience: role === 'admin' ? 'all' : (classNames[0] ?? ''), status: 'published', publishAt: toLocalInput(new Date(Date.now() + 86_400_000).toISOString()), pinned: false }
          }
          fields={[
            { name: 'title', label: t('common.title', { ns: 'common' }), span: 2 },
            { name: 'body', label: t('announcements.body'), type: 'textarea', rows: 5 },
            { name: 'audience', label: t('common.audience', { ns: 'common' }), type: 'select', options: audienceOptions },
            {
              name: 'status',
              label: t('common.status', { ns: 'common' }),
              type: 'select',
              options: (['published', 'scheduled', 'draft'] as const).map((v) => ({ value: v, label: t(`announcements.statusAction.${v}`) })),
            },
            { name: 'publishAt', label: t('announcements.publishAt'), type: 'datetime-local', hint: t('announcements.publishAtHint') },
            ...(role === 'admin' ? [{ name: 'pinned', label: t('announcements.pin'), type: 'switch' as const, description: t('announcements.pinHint') }] : []),
          ]}
          submitLabel={t('actions.save', { ns: 'common' })}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            const input: AnnouncementInput = {
              title: v.title,
              body: v.body,
              audience: v.audience,
              audienceLabel: labelOf(v.audience),
              status: v.status,
              pinned: role === 'admin' ? v.pinned : false,
              publishedAt: v.status === 'scheduled' ? new Date(v.publishAt).toISOString() : editing?.item?.status === 'published' ? editing.item.publishedAt : new Date().toISOString(),
              author: editing?.item?.author ?? me,
              authorRole: role === 'admin' ? 'admin' : 'teacher',
            };
            const current = editing?.item;
            if (current) await announcementApi.update(current.id, input);
            else await announcementApi.create(input);
            setEditing(null);
            list.refresh();
            await run(async () => null, { success: t(v.status === 'published' ? 'announcements.published' : 'announcements.saved') });
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title={t('announcements.deleteTitle')}
        message={t('announcements.deleteMessage', { title: deleting?.title ?? '' })}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await run(async () => {
            await announcementApi.remove(deleting.id);
            return true;
          }, { success: t('announcements.deleted') });
          setDeleting(null);
          if (ok) list.refresh();
        }}
      />
    </>
  );
}
