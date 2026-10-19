import clsx from 'clsx';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { FormModal } from '@/components/form/FormModal';
import { required } from '@/components/form/validation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { AsyncContent, Skeleton } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import type { CalendarEvent, UserRole } from '@/types';
import { formatDate, formatTime, formatTimeRange, toIntlLocale } from '@/utils/format';
import { useClassNames } from '../hooks/useClassNames';
import { calendarApi } from '../services/commsApi';

const EVENT_STYLE: Record<CalendarEvent['kind'], { dot: string; chip: string }> = {
  lesson: { dot: 'bg-primary', chip: 'bg-accent-soft text-accent-ink' },
  exam: { dot: 'bg-danger', chip: 'bg-danger/[0.1] text-danger' },
  homework: { dot: 'bg-achievement', chip: 'bg-achievement-soft text-achievement-ink' },
  activity: { dot: 'bg-success', chip: 'bg-success/[0.1] text-success' },
  meeting: { dot: 'bg-info', chip: 'bg-info/[0.1] text-info' },
  other: { dot: 'bg-muted-foreground', chip: 'bg-foreground/[0.06] text-muted-foreground' },
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const schema = z
  .object({ title: required(), kind: z.enum(['lesson', 'exam', 'homework', 'activity', 'meeting', 'other']), date: required(), start: required(), end: required(), classLabel: z.string(), description: z.string() })
  .refine((v) => v.end > v.start, { path: ['end'], message: 'validation.endAfterStart' });
type FormValues = z.infer<typeof schema>;

export default function CalendarPage({ role }: { role: UserRole }) {
  const { t } = useTranslation(['shared', 'common']);
  // Only teachers attach a class to their own events.
  const classNames = useClassNames(role === 'teacher' ? 'teacher' : 'student');
  const locale = useLocale();
  const service = useMemo(() => calendarApi(role), [role]);
  const { data, error, loading, reload } = useAsync((signal) => service.list({ sortKey: 'start' }, signal), [service]);
  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);
  const [view, setView] = useState<'month' | 'list'>('month');
  const [adding, setAdding] = useState(false);
  const { run } = useAction();

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of data?.items ?? []) {
      const k = dayKey(new Date(e.start));
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return map;
  }, [data]);

  // Monday-first grid covering the month.
  const cells = useMemo(() => {
    const first = new Date(cursor);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [cursor]);
  const weeks = Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7)).filter((week, i) => i < 5 || week.some((d) => d.getMonth() === cursor.getMonth()));
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(toIntlLocale(locale), { weekday: 'short' }).format(new Date(2024, 0, 1 + i)));
  const selectedEvents = byDay.get(dayKey(selected)) ?? [];
  const upcoming = (data?.items ?? []).filter((e) => new Date(e.end).getTime() >= Date.now() - 3_600_000);

  const move = (delta: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <>
      <PageHeader
        title={t(`nav.${role}.calendar`, { ns: 'common' })}
        description={t(`calendar.description.${role}`)}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setAdding(true)}>
            {t(role === 'teacher' ? 'calendar.addEvent' : 'calendar.addPersonal')}
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconButton size="md" icon={ChevronLeft} label={t('calendar.prev')} onClick={() => move(-1)} />
          <h2 className="min-w-[180px] text-center font-display text-[20px] font-extrabold capitalize text-foreground" aria-live="polite">
            {formatDate(cursor, locale, { month: 'long', year: 'numeric' })}
          </h2>
          <IconButton size="md" icon={ChevronRight} label={t('calendar.next')} onClick={() => move(1)} />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelected(today);
            }}
          >
            {t('common.today', { ns: 'common' })}
          </Button>
        </div>
        <SegmentedControl
          size="sm"
          label={t('calendar.view')}
          hideLabel
          value={view}
          onChange={setView}
          options={[
            { value: 'month', label: t('calendar.month') },
            { value: 'list', label: t('calendar.list') },
          ]}
        />
      </div>

      <AsyncContent data={data} error={error} loading={loading} reload={reload} skeleton={<Skeleton className="h-[560px] rounded-panel" />}>
        {() =>
          view === 'month' ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="panel overflow-hidden">
                <table className="w-full table-fixed border-collapse">
                  <caption className="sr-only">{formatDate(cursor, locale, { month: 'long', year: 'numeric' })}</caption>
                  <thead>
                    <tr className="bg-surface-muted">
                      {weekdays.map((d) => (
                        <th key={d} scope="col" className="py-2.5 text-[12.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((week, wi) => (
                      <tr key={wi}>
                        {week.map((d) => {
                          const events = byDay.get(dayKey(d)) ?? [];
                          const inMonth = d.getMonth() === cursor.getMonth();
                          const isToday = dayKey(d) === dayKey(today);
                          const isSelected = dayKey(d) === dayKey(selected);
                          return (
                            <td key={d.toISOString()} className="h-[96px] border-r border-t border-border p-0 align-top last:border-r-0 sm:h-[112px]">
                              <button
                                type="button"
                                onClick={() => setSelected(d)}
                                aria-pressed={isSelected}
                                aria-label={`${formatDate(d, locale, { day: 'numeric', month: 'long', weekday: 'long' })}${events.length ? `, ${t('calendar.eventCount', { count: events.length })}` : ''}`}
                                className={clsx('flex h-full w-full flex-col items-stretch gap-1 p-1.5 text-left transition-colors hover:bg-surface-muted/80', isSelected && 'bg-accent-soft/70', !inMonth && 'opacity-45')}
                              >
                                <span className={clsx('flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums', isToday ? 'bg-primary text-primary-foreground' : 'text-foreground')}>{d.getDate()}</span>
                                {events.slice(0, 2).map((e) => (
                                  <span key={e.id} className={clsx('hidden truncate rounded-[6px] px-1.5 py-0.5 text-[11.5px] font-semibold sm:block', EVENT_STYLE[e.kind].chip)} aria-hidden>
                                    {e.title}
                                  </span>
                                ))}
                                {events.length > 0 && (
                                  <span className="flex items-center gap-1 sm:hidden" aria-hidden>
                                    {events.slice(0, 3).map((e) => (
                                      <span key={e.id} className={clsx('h-1.5 w-1.5 rounded-full', EVENT_STYLE[e.kind].dot)} />
                                    ))}
                                  </span>
                                )}
                                {events.length > 2 && <span className="hidden text-[11px] font-semibold text-muted-foreground sm:block" aria-hidden>+{events.length - 2}</span>}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Panel icon={CalendarDays} title={formatDate(selected, locale, { day: 'numeric', month: 'long', weekday: 'long' })}>
                {selectedEvents.length === 0 ? (
                  <p className="py-6 text-center text-[14px] text-muted-foreground">{t('calendar.noEvents')}</p>
                ) : (
                  <EventList events={selectedEvents} role={role} onRemoved={reload} />
                )}
              </Panel>
            </div>
          ) : (
            <Panel title={t('calendar.upcoming')}>
              {upcoming.length === 0 ? <p className="py-6 text-center text-muted-foreground">{t('calendar.noUpcoming')}</p> : <EventList events={upcoming} role={role} onRemoved={reload} showDate />}
            </Panel>
          )
        }
      </AsyncContent>

      <FormModal<FormValues>
        open={adding}
        title={t(role === 'teacher' ? 'calendar.addEvent' : 'calendar.addPersonal')}
        schema={schema}
        defaultValues={{ title: '', kind: role === 'teacher' ? 'lesson' : 'other', date: `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`, start: '10:00', end: '10:40', classLabel: '', description: '' }}
        fields={[
          { name: 'title', label: t('common.title', { ns: 'common' }), span: 2 },
          {
            name: 'kind',
            label: t('common.type', { ns: 'common' }),
            type: 'select',
            options: (role === 'teacher' ? (['lesson', 'exam', 'homework', 'activity', 'meeting', 'other'] as const) : (['other', 'homework', 'exam'] as const)).map((k) => ({ value: k, label: t(`calendar.kinds.${k}`) })),
          },
          { name: 'date', label: t('common.date', { ns: 'common' }), type: 'date' },
          { name: 'start', label: t('common.start', { ns: 'common' }), type: 'time' },
          { name: 'end', label: t('common.end', { ns: 'common' }), type: 'time' },
          ...(role === 'teacher'
            ? [{ name: 'classLabel', label: t('common.class', { ns: 'common' }), type: 'select' as const, options: classNames.map((c) => ({ value: c, label: c })), placeholderOption: t('calendar.noClass') }]
            : []),
          { name: 'description', label: `${t('common.description', { ns: 'common' })} (${t('common.optional', { ns: 'common' })})`, type: 'textarea', rows: 2 },
        ]}
        submitLabel={t('actions.add', { ns: 'common' })}
        onClose={() => setAdding(false)}
        onSubmit={async (v) => {
          const [y, m, d] = v.date.split('-').map(Number);
          const at = (hm: string) => {
            const [h, min] = hm.split(':').map(Number);
            return new Date(y, m - 1, d, h, min).toISOString();
          };
          await service.create({ title: v.title, kind: v.kind, start: at(v.start), end: at(v.end), classLabel: v.classLabel || null, description: v.description || undefined, editable: true });
          setAdding(false);
          setSelected(new Date(y, m - 1, d));
          setCursor(new Date(y, m - 1, 1));
          reload();
          await run(async () => null, { success: t('calendar.added') });
        }}
      />
    </>
  );
}

function EventList({ events, role, onRemoved, showDate }: { events: CalendarEvent[]; role: UserRole; onRemoved: () => void; showDate?: boolean }) {
  const { t } = useTranslation(['shared', 'common']);
  const locale = useLocale();
  const { run } = useAction();
  const service = useMemo(() => calendarApi(role), [role]);
  return (
    <ol className="space-y-2.5">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3 rounded-[14px] border border-border p-3">
          <span className={clsx('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', EVENT_STYLE[e.kind].dot)} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{e.title}</p>
            <p className="text-[13px] text-muted-foreground">
              {showDate && `${formatDate(e.start, locale, { day: 'numeric', month: 'short', weekday: 'short' })} · `}
              {e.start === e.end ? `${t('calendar.dueAt')} ${formatTime(e.start, locale)}` : formatTimeRange(e.start, e.end, locale)} · {t(`calendar.kinds.${e.kind}`)}
              {e.classLabel && ` · ${e.classLabel}`}
            </p>
            {e.description && <p className="mt-1 text-[13px] text-foreground">{e.description}</p>}
          </div>
          {e.editable && (
            <IconButton
              icon={Trash2}
              tone="danger"
              label={`${t('actions.delete', { ns: 'common' })}: ${e.title}`}
              onClick={async () => {
                const ok = await run(async () => {
                  await service.remove(e.id);
                  return true;
                }, { success: t('calendar.removed') });
                if (ok) onRemoved();
              }}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
