import { CalendarClock, ListChecks, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import type { ExamType } from '@/types';
import { formatDate, formatTime } from '@/utils/format';
import { MOCK_LAYOUTS, type MockExam, mockExamApi, type MockExamInput } from '../services/teacherApi';
import { useTeachingScope } from '../hooks/useTeachingScope';

const DURATION: Record<ExamType, number> = { LGS: 135, TYT: 165, AYT: 180 };
const STATUS_TONE = { draft: 'neutral', scheduled: 'info', completed: 'success' } as const;
type View = 'upcoming' | 'completed';

export default function MockExamsPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const locale = useLocale();
  const { data, error, loading, reload } = useAsync((signal) => mockExamApi.list({ offset: 0, limit: 100, sortKey: 'date' }, signal), []);
  const [view, setView] = useState<View>('upcoming');
  const [editor, setEditor] = useState<{ item: MockExam | null } | null>(null);
  const [deleting, setDeleting] = useState<MockExam | null>(null);
  const { run, busy } = useAction();

  const items = (data?.items ?? []).filter((m) => (view === 'completed' ? m.status === 'completed' : m.status !== 'completed'));

  return (
    <>
      <PageHeader
        title={t('nav.teacher.mockExams', { ns: 'common' })}
        description={t('mocks.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditor({ item: null })}>
            {t('mocks.add')}
          </Button>
        }
      />
      <Tabs<View>
        className="mb-4"
        label={t('mocks.viewLabel')}
        value={view}
        onChange={setView}
        items={[
          { value: 'upcoming', label: t('mocks.upcoming') },
          { value: 'completed', label: t('mocks.completed') },
        ]}
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {() =>
          items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<Target className="h-5 w-5" aria-hidden />} title={t('mocks.empty')} />
            </div>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {(view === 'completed' ? [...items].reverse() : items).map((m) => {
                const total = m.distribution.reduce((n, d) => n + d.count, 0);
                return (
                  <li key={m.id} className="panel p-5">
                    <div className="flex items-start gap-3">
                      <span className="icon-tile h-12 w-12 bg-tint-peach text-ink-peach font-display text-[13px] font-extrabold">{m.examType}</span>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-[17px] font-extrabold text-foreground">{m.title}</h2>
                        <p className="text-[13.5px] text-muted-foreground">
                          {formatDate(m.date, locale, { day: 'numeric', month: 'long', weekday: 'short' })} {formatTime(m.date, locale)} · {t('common.minutesShort', { ns: 'common', count: m.durationMinutes })}
                        </p>
                      </div>
                      <Badge tone={STATUS_TONE[m.status]} dot>
                        {t(`mocks.status.${m.status}`)}
                      </Badge>
                    </div>
                    <div className="mt-4 flex h-3 overflow-hidden rounded-full" role="img" aria-label={m.distribution.map((d) => `${d.subject} ${d.count}`).join(', ')}>
                      {m.distribution.map((d, i) => (
                        <span key={d.subject} className={['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'][i % 5]} style={{ width: `${(d.count / total) * 100}%` }} />
                      ))}
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                      {m.distribution.map((d, i) => (
                        <li key={d.subject} className="flex items-center gap-1.5">
                          <span aria-hidden className={`h-2 w-2 rounded-full ${['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'][i % 5]}`} />
                          {d.subject} · {d.count}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <span className="flex flex-wrap gap-1">
                        {m.classNames.map((c) => (
                          <Badge key={c}>{c}</Badge>
                        ))}
                        <span className="ml-1 text-[12.5px] text-muted-foreground">{t('common.questions', { ns: 'common', count: total })}</span>
                      </span>
                      {m.status !== 'completed' && (
                        <span className="flex gap-1">
                          <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${m.title}`} onClick={() => setEditor({ item: m })} />
                          <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${m.title}`} onClick={() => setDeleting(m)} />
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        }
      </AsyncContent>
      <MockEditor
        open={editor !== null}
        item={editor?.item ?? null}
        onClose={() => setEditor(null)}
        onSaved={() => {
          setEditor(null);
          setView('upcoming');
          reload();
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('mocks.deleteTitle')}
        message={t('mocks.deleteMessage', { title: deleting?.title ?? '' })}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await run(async () => {
            await mockExamApi.remove(deleting.id);
            return true;
          }, { success: t('mocks.deleted') });
          setDeleting(null);
          if (ok) reload();
        }}
      />
    </>
  );
}

function MockEditor({ open, item, onClose, onSaved }: { open: boolean; item: MockExam | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation(['teacher', 'common']);
  const scope = useTeachingScope();
  const [examType, setExamType] = useState<ExamType>('LGS');
  const [title, setTitle] = useState('');
  const [classNames, setClassNames] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    if (item) {
      const d = new Date(item.date);
      setExamType(item.examType);
      setTitle(item.title);
      setClassNames(item.classNames);
      setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    } else {
      setExamType('LGS');
      setTitle('');
      setClassNames([]);
      setDate(new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10));
      setTime('10:00');
    }
  }, [open, item]);

  const when = new Date(`${date}T${time}`);
  const errors = { title: !title.trim(), classes: classNames.length === 0, date: Number.isNaN(when.getTime()) || when.getTime() < Date.now() };
  const save = async (status: MockExamInput['status']) => {
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    const input: MockExamInput = { examType, title: title.trim(), distribution: MOCK_LAYOUTS[examType], classNames, date: when.toISOString(), durationMinutes: DURATION[examType], status };
    const ok = await run(() => (item ? mockExamApi.update(item.id, input) : mockExamApi.create(input)), { success: t(status === 'scheduled' ? 'mocks.scheduledToast' : 'mocks.savedDraft') });
    if (ok) onSaved();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      preventClose={busy}
      title={item ? t('mocks.editTitle') : t('mocks.add')}
      description={t('mocks.editorHint')}
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={() => void save('draft')}>
            {t('actions.saveDraft', { ns: 'common' })}
          </Button>
          <Button loading={busy} icon={<CalendarClock className="h-4 w-4" aria-hidden />} onClick={() => void save('scheduled')}>
            {t('exams.schedule')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SegmentedControl label={t('common.examType', { ns: 'common' })} value={examType} onChange={setExamType} options={(['LGS', 'TYT', 'AYT'] as const).map((v) => ({ value: v, label: v }))} />
        <div className="rounded-[14px] bg-surface-muted p-4">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <ListChecks className="h-4 w-4 text-accent-ink" aria-hidden />
            {t('mocks.layout', { minutes: DURATION[examType] })}
          </p>
          <ul className="mt-2 grid gap-1 text-[13.5px] text-muted-foreground sm:grid-cols-2">
            {MOCK_LAYOUTS[examType].map((d) => (
              <li key={d.subject}>
                {d.subject}: <span className="font-semibold text-foreground">{t('common.questions', { ns: 'common', count: d.count })}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12.5px] text-muted-foreground">{t('mocks.fromArchive')}</p>
        </div>
        <Input label={t('common.title', { ns: 'common' })} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('mocks.titlePlaceholder', { type: examType })} error={touched && errors.title ? t('validation.required', { ns: 'common' }) : undefined} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('common.date', { ns: 'common' })} type="date" value={date} onChange={(e) => setDate(e.target.value)} error={touched && errors.date ? t('validation.futureDate', { ns: 'common' }) : undefined} />
          <Input label={t('common.time', { ns: 'common' })} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <fieldset>
          <legend className="field-label">{t('exams.classes')}</legend>
          <div className="flex flex-wrap gap-4">
            {scope.classNames.map((c) => (
              <Checkbox key={c} label={c} checked={classNames.includes(c)} onChange={(e) => setClassNames(e.target.checked ? [...classNames, c] : classNames.filter((x) => x !== c))} />
            ))}
          </div>
          {touched && errors.classes && <p className="mt-1 text-[13px] text-danger">{t('validation.pickOne', { ns: 'common' })}</p>}
        </fieldset>
      </div>
    </Modal>
  );
}
