import clsx from 'clsx';
import { CalendarX2, Copy, ExternalLink, Plus, Users, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useAuth } from '@/app/providers/authContext';
import { FormModal } from '@/components/form/FormModal';
import { required } from '@/components/form/validation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { IS_MOCK_MODE } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { useOpenParam } from '@/hooks/useOpenParam';
import type { Meeting, UserRole } from '@/types';
import { formatDate, formatTimeRange } from '@/utils/format';
import { meetingApi } from '../services/commsApi';

const schema = z
  .object({ title: required(), date: required(), start: required(), end: required(), participants: required(), agenda: z.string() })
  .refine((v) => v.end > v.start, { path: ['end'], message: 'validation.endAfterStart' });
type FormValues = z.infer<typeof schema>;
type View = 'upcoming' | 'past';

export default function MeetingsPage({ role }: { role: UserRole }) {
  const { t } = useTranslation(['shared', 'common']);
  const locale = useLocale();
  const { user } = useAuth();
  const service = useMemo(() => meetingApi(role), [role]);
  const { data, error, loading, reload } = useAsync((signal) => service.list({ offset: 0, limit: 200, sortKey: 'start' }, signal), [service]);
  const [view, setView] = useState<View>('upcoming');
  const [joining, setJoining] = useState<Meeting | null>(null);
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState<Meeting | null>(null);
  const { run, busy } = useAction();
  const canCreate = role === 'teacher';
  const me = user ? `${user.firstName} ${user.lastName}` : '';

  useOpenParam((id) => {
    const m = data?.items.find((x) => x.id === id);
    if (m) setJoining(m);
  }, Boolean(data));

  const now = Date.now();
  const items = (data?.items ?? []).filter((m) => (view === 'upcoming' ? m.status === 'scheduled' && new Date(m.end).getTime() >= now : m.status !== 'scheduled' || new Date(m.end).getTime() < now));
  const ordered = view === 'past' ? [...items].reverse() : items;

  return (
    <>
      <PageHeader
        title={t(`nav.${role}.meetings`, { ns: 'common' })}
        description={t(`meetings.description.${role}`)}
        actions={
          canCreate && (
            <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setCreating(true)}>
              {t('meetings.add')}
            </Button>
          )
        }
      />
      <Tabs<View>
        className="mb-4"
        label={t('meetings.viewLabel')}
        value={view}
        onChange={setView}
        items={[
          { value: 'upcoming', label: t('meetings.upcoming') },
          { value: 'past', label: t('meetings.past') },
        ]}
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {() =>
          ordered.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<Video className="h-5 w-5" aria-hidden />} title={t(view === 'upcoming' ? 'meetings.emptyUpcoming' : 'meetings.emptyPast')} />
            </div>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {ordered.map((m) => {
                const live = new Date(m.start).getTime() - now < 15 * 60_000 && new Date(m.end).getTime() > now && m.status === 'scheduled';
                return (
                  <li key={m.id} className={clsx('panel flex flex-col p-5', live && 'ring-2 ring-lime')}>
                    <div className="flex items-start gap-3">
                      <span className="flex w-14 shrink-0 flex-col items-center rounded-[14px] bg-tint-violet py-2 text-ink-violet">
                        <span className="text-[11.5px] font-bold uppercase">{formatDate(m.start, locale, { month: 'short' })}</span>
                        <span className="font-display text-[22px] font-extrabold leading-none">{new Date(m.start).getDate()}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-[17px] font-extrabold text-foreground">{m.title}</h2>
                        <p className="text-[13.5px] text-muted-foreground">
                          {formatDate(m.start, locale, { weekday: 'long' })} · {formatTimeRange(m.start, m.end, locale)}
                        </p>
                      </div>
                      {live ? (
                        <Badge tone="lime" dot>
                          {t('meetings.live')}
                        </Badge>
                      ) : m.status === 'cancelled' ? (
                        <Badge tone="danger">{t('meetings.cancelled')}</Badge>
                      ) : m.status === 'done' || new Date(m.end).getTime() < now ? (
                        <Badge tone="neutral">{t('meetings.done')}</Badge>
                      ) : null}
                    </div>
                    <p className="mt-3 text-[14px] text-foreground">{m.agenda}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                      <Users className="h-4 w-4" aria-hidden />
                      {m.organizer} → {m.participants.join(', ')}
                    </p>
                    {view === 'upcoming' && (
                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        {canCreate && m.organizer === me && (
                          <Button variant="ghost" size="sm" className="text-danger" icon={<CalendarX2 className="h-4 w-4" aria-hidden />} onClick={() => setCancelling(m)}>
                            {t('meetings.cancel')}
                          </Button>
                        )}
                        <Button variant={live ? 'ink' : 'soft'} size="sm" icon={<Video className="h-4 w-4" aria-hidden />} onClick={() => setJoining(m)} aria-label={`${t('actions.join', { ns: 'common' })}: ${m.title}`}>
                          {t('actions.join', { ns: 'common' })}
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )
        }
      </AsyncContent>

      <Modal
        open={joining !== null}
        onClose={() => setJoining(null)}
        size="sm"
        title={joining?.title ?? ''}
        description={joining ? `${formatDate(joining.start, locale, { day: 'numeric', month: 'long', weekday: 'long' })} · ${formatTimeRange(joining.start, joining.end, locale)}` : undefined}
        footer={
          joining && (
            <>
              <Button
                variant="secondary"
                icon={<Copy className="h-4 w-4" aria-hidden />}
                onClick={() => void run(() => navigator.clipboard.writeText(joining.link), { success: t('meetings.copied'), description: '' })}
              >
                {t('actions.copyLink', { ns: 'common' })}
              </Button>
              {IS_MOCK_MODE ? (
                <Button variant="ink" disabled icon={<ExternalLink className="h-4 w-4" aria-hidden />}>
                  {t('meetings.open')}
                </Button>
              ) : (
                <a href={joining.link} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-control bg-ink px-4 font-semibold text-ink-foreground">
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  {t('meetings.open')}
                </a>
              )}
            </>
          )
        }
      >
        {joining && (
          <>
            <p className="break-all rounded-[12px] bg-surface-muted px-3 py-2 font-mono text-[13px] text-foreground">{joining.link}</p>
            {IS_MOCK_MODE && <p className="mt-3 text-[13px] text-muted-foreground">{t('meetings.demoLink')}</p>}
          </>
        )}
      </Modal>

      {canCreate && (
        <FormModal<FormValues>
          open={creating}
          title={t('meetings.add')}
          schema={schema}
          defaultValues={{ title: '', date: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10), start: '15:00', end: '15:30', participants: '', agenda: '' }}
          fields={[
            { name: 'title', label: t('common.title', { ns: 'common' }), span: 2 },
            { name: 'date', label: t('common.date', { ns: 'common' }), type: 'date' },
            { name: 'start', label: t('common.start', { ns: 'common' }), type: 'time' },
            { name: 'end', label: t('common.end', { ns: 'common' }), type: 'time' },
            { name: 'participants', label: t('common.participants', { ns: 'common' }), placeholder: t('meetings.participantsPlaceholder'), hint: t('meetings.participantsHint') },
            { name: 'agenda', label: t('meetings.agenda'), type: 'textarea', rows: 3 },
          ]}
          submitLabel={t('meetings.create')}
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            const [y, mo, d] = v.date.split('-').map(Number);
            const at = (hm: string) => {
              const [h, mi] = hm.split(':').map(Number);
              return new Date(y, mo - 1, d, h, mi).toISOString();
            };
            const slug = v.title.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'toplanti';
            await service.create({
              title: v.title,
              start: at(v.start),
              end: at(v.end),
              organizer: me,
              participants: v.participants.split(',').map((p) => p.trim()).filter(Boolean),
              // The server creates the real meeting room; the demo only shows a placeholder address.
              link: IS_MOCK_MODE ? `https://meet.demo.okul/${slug}-${Date.now().toString(36)}` : '',
              agenda: v.agenda,
              status: 'scheduled',
            });
            setCreating(false);
            setView('upcoming');
            reload();
            await run(async () => null, { success: t('meetings.created') });
          }}
        />
      )}
      <ConfirmDialog
        open={cancelling !== null}
        title={t('meetings.cancelTitle')}
        message={t('meetings.cancelMessage', { title: cancelling?.title ?? '' })}
        confirmLabel={t('meetings.cancel')}
        busy={busy}
        onCancel={() => setCancelling(null)}
        onConfirm={async () => {
          if (!cancelling) return;
          const ok = await run(() => service.update(cancelling.id, { status: 'cancelled' }), { success: t('meetings.cancelledToast') });
          setCancelling(null);
          if (ok) reload();
        }}
      />
    </>
  );
}
