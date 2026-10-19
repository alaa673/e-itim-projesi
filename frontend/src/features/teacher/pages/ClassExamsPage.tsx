import { BarChart3, CalendarClock, ClipboardList, Eye, Pencil, Plus, Shuffle, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Meter } from '@/components/charts/Meter';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Column } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/States';
import { IS_MOCK_MODE } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { useLocale } from '@/hooks/useLocale';
import { useStateFlag } from '@/hooks/useOpenParam';
import { useResourceList } from '@/hooks/useResourceList';
import { formatDate, formatPercent, formatTime } from '@/utils/format';
import { QuestionPreview } from './QuestionBankPage';
import { bankApi, type ClassExam, examApi, type ExamInput, rosterNames } from '../services/teacherApi';
import { useTeachingScope } from '../hooks/useTeachingScope';

export const EXAM_STATUS_TONE = { draft: 'neutral', scheduled: 'info', active: 'lime', completed: 'success' } as const;
const RESULT_EXAMS = ['exam-8a-u2', 'exam-8b-u2', 'exam-7a-q3'];
const hasResults = (e: ClassExam) => e.status === 'completed' && (!IS_MOCK_MODE || RESULT_EXAMS.includes(e.id));

export default function ClassExamsPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const locale = useLocale();
  const lq = useListQuery<'status'>({ sort: { key: 'date', direction: 'desc' }, descFirst: ['date'] });
  const list = useResourceList(examApi.list, lq.query);
  const [editor, setEditor] = useState<{ exam: ClassExam | null } | null>(null);
  const [preview, setPreview] = useState<ClassExam | null>(null);
  const [deleting, setDeleting] = useState<ClassExam | null>(null);
  const { run, busy } = useAction();
  useStateFlag('openCreate', () => setEditor({ exam: null }));

  const columns: Column<ClassExam>[] = [
    {
      id: 'title',
      header: t('exams.exam'),
      sortKey: 'title',
      rowHeader: true,
      cell: (e) => (
        <span className="block min-w-[200px]">
          <span className="block font-semibold text-foreground">{e.title}</span>
          <span className="block text-[12.5px] font-normal text-muted-foreground">{e.classNames.join(', ')}</span>
        </span>
      ),
    },
    {
      id: 'date',
      header: t('common.date', { ns: 'common' }),
      sortKey: 'date',
      cell: (e) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatDate(e.date, locale, { day: 'numeric', month: 'short' })} {formatTime(e.date, locale)}
          <span className="block text-[12.5px] text-muted-foreground">{t('common.minutesShort', { ns: 'common', count: e.durationMinutes })}</span>
        </span>
      ),
    },
    { id: 'questions', header: t('common.questionCount', { ns: 'common' }), align: 'center', hideOnMobile: true, cell: (e) => <span className="tabular-nums">{e.questionIds.length || '—'}</span> },
    { id: 'status', header: t('common.status', { ns: 'common' }), cell: (e) => <Badge tone={EXAM_STATUS_TONE[e.status]} dot>{t(`exams.status.${e.status}`)}</Badge> },
    {
      id: 'completion',
      header: t('exams.completion'),
      hideOnMobile: true,
      cell: (e) =>
        e.assigned ? (
          <span className="flex min-w-[130px] items-center gap-2">
            <Meter className="w-16" size="sm" value={e.completed} max={e.assigned} tone="role" label={`${e.title} ${t('exams.completion')}`} />
            <span className="text-[12.5px] tabular-nums text-muted-foreground">
              {e.completed}/{e.assigned}
            </span>
          </span>
        ) : (
          '—'
        ),
    },
    { id: 'average', header: t('common.average', { ns: 'common' }), align: 'right', cell: (e) => <span className="font-semibold tabular-nums">{e.average === null ? '—' : formatPercent(e.average, locale)}</span> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (e) => (
        <span className="flex justify-end gap-1">
          {hasResults(e) && (
            <Link to={`/teacher/results?exam=${e.id}`} className={buttonClass('soft', 'sm')} aria-label={`${t('exams.results')}: ${e.title} ${e.classNames.join(', ')}`}>
              <BarChart3 className="h-4 w-4" aria-hidden />
              {t('exams.results')}
            </Link>
          )}
          {e.questionIds.length > 0 && <IconButton icon={Eye} label={`${t('actions.preview', { ns: 'common' })}: ${e.title}`} onClick={() => setPreview(e)} />}
          {(e.status === 'draft' || e.status === 'scheduled') && <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${e.title}`} onClick={() => setEditor({ exam: e })} />}
          {e.status === 'draft' && <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${e.title}`} onClick={() => setDeleting(e)} />}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('nav.teacher.classExams', { ns: 'common' })}
        description={t('exams.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditor({ exam: null })}>
            {t('quickActions.createQuiz', { ns: 'common' })}
          </Button>
        }
      />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('exams.searchPlaceholder')}
        filters={[{ key: 'status', label: t('common.status', { ns: 'common' }), value: lq.filters.status ?? '', allLabel: t('common.allStatuses', { ns: 'common' }), options: (['draft', 'scheduled', 'active', 'completed'] as const).map((v) => ({ value: v, label: t(`exams.status.${v}`) })) }]}
        onFilter={(_, v) => lq.setFilter('status', v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('nav.teacher.classExams', { ns: 'common' })}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={preview?.id ?? editor?.exam?.id ?? null}
        empty={{ icon: <ClipboardList className="h-5 w-5" aria-hidden />, title: t('exams.empty') }}
      />

      <ExamEditor
        open={editor !== null}
        exam={editor?.exam ?? null}
        onClose={() => setEditor(null)}
        onSaved={(saved, created) => {
          setEditor(null);
          if (created) list.refresh();
          else list.updateItem(saved);
        }}
      />
      <ExamPreview exam={preview} onClose={() => setPreview(null)} />
      <ConfirmDialog
        open={deleting !== null}
        title={t('exams.deleteTitle')}
        message={t('exams.deleteMessage', { title: deleting?.title ?? '' })}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await run(async () => {
            await examApi.remove(deleting.id);
            return true;
          }, { success: t('exams.deleted') });
          setDeleting(null);
          if (ok) list.refresh();
        }}
      />
    </>
  );
}

function ExamPreview({ exam, onClose }: { exam: ClassExam | null; onClose: () => void }) {
  const { t } = useTranslation(['teacher', 'common']);
  const questions = useAsync(
    async (signal) => {
      if (!exam) return [];
      const all = await bankApi.list({ offset: 0, limit: 500 }, signal);
      return exam.questionIds.map((id) => all.items.find((q) => q.id === id)).filter((q): q is NonNullable<typeof q> => Boolean(q));
    },
    [exam?.id],
  );
  return (
    <Modal open={exam !== null} onClose={onClose} size="lg" title={exam?.title ?? ''} description={exam ? exam.classNames.join(', ') : undefined}>
      {questions.loading && !questions.data ? (
        <Skeleton className="h-60 rounded-[14px]" />
      ) : (
        <ol className="space-y-4">
          {(questions.data ?? []).map((q, i) => (
            <li key={q.id} className="rounded-[16px] border border-border p-4">
              <p className="mb-2 text-[12.5px] font-semibold text-muted-foreground">
                {t('exams.questionNo', { number: i + 1 })} · {q.topic}
              </p>
              <QuestionPreview q={q} />
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}

function toLocal(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
}

function ExamEditor({ open, exam, onClose, onSaved }: { open: boolean; exam: ClassExam | null; onClose: () => void; onSaved: (e: ClassExam, created: boolean) => void }) {
  const { t } = useTranslation(['teacher', 'common']);
  const scope = useTeachingScope();
  const bank = useAsync((signal) => (open ? bankApi.list({ offset: 0, limit: 500, filters: { status: 'approved' } }, signal) : Promise.resolve(null)), [open]);
  const tomorrow = toLocal(new Date(Date.now() + 86_400_000).toISOString().replace(/T.*/, 'T10:00:00'));
  const [form, setForm] = useState({ title: '', classNames: [] as string[], date: tomorrow.date, time: '10:00', duration: '40', questionIds: [] as string[] });
  const [topic, setTopic] = useState('');
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setTopic('');
    if (exam) {
      const l = toLocal(exam.date);
      setForm({ title: exam.title, classNames: exam.classNames, date: l.date, time: l.time, duration: String(exam.durationMinutes), questionIds: exam.questionIds });
    } else setForm({ title: '', classNames: [], date: tomorrow.date, time: '10:00', duration: '40', questionIds: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exam]);

  const pool = useMemo(() => (bank.data?.items ?? []).filter((q) => !topic || q.topic === topic), [bank.data, topic]);
  const when = new Date(`${form.date}T${form.time}`);
  const errors = {
    title: !form.title.trim(),
    classes: form.classNames.length === 0,
    date: Number.isNaN(when.getTime()) || when.getTime() < Date.now(),
    questions: form.questionIds.length === 0,
  };

  const save = async (status: ExamInput['status']) => {
    setTouched(true);
    if (errors.title || errors.classes || (status === 'scheduled' && (errors.date || errors.questions))) return;
    const saved = await run(async () => {
      const rosters = status === 'scheduled' ? await Promise.all(form.classNames.map(rosterNames)) : [];
      const input: ExamInput = { title: form.title.trim(), classNames: form.classNames, date: when.toISOString(), durationMinutes: Number(form.duration), questionIds: form.questionIds, status, assigned: rosters.reduce((n, r) => n + r.length, 0) };
      return exam ? examApi.update(exam.id, input) : examApi.create(input);
    }, { success: t(status === 'scheduled' ? 'exams.scheduled' : 'exams.savedDraft', { classes: form.classNames.join(', ') }) });
    if (saved) onSaved(saved, !exam);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      preventClose={busy}
      title={exam ? t('exams.editTitle') : t('quickActions.createQuiz', { ns: 'common' })}
      description={t('exams.editorHint')}
      footer={
        <>
          <Button variant="secondary" onClick={() => void save('draft')} disabled={busy}>
            {t('actions.saveDraft', { ns: 'common' })}
          </Button>
          <Button loading={busy} icon={<CalendarClock className="h-4 w-4" aria-hidden />} onClick={() => void save('scheduled')}>
            {t('exams.schedule')}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <Input containerClassName="sm:col-span-2" label={t('common.title', { ns: 'common' })} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={touched && errors.title ? t('validation.required', { ns: 'common' }) : undefined} />
        <Input label={t('common.date', { ns: 'common' })} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} error={touched && errors.date ? t('validation.futureDate', { ns: 'common' }) : undefined} />
        <Input label={t('common.time', { ns: 'common' })} type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        <Select label={t('common.duration', { ns: 'common' })} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} options={['20', '30', '40', '60', '80'].map((v) => ({ value: v, label: t('common.minutes', { ns: 'common', count: Number(v) }) }))} />
        <fieldset className="sm:col-span-3">
          <legend className="field-label">{t('exams.classes')}</legend>
          <div className="flex flex-wrap gap-4">
            {scope.classNames.map((c) => (
              <Checkbox key={c} label={c} checked={form.classNames.includes(c)} onChange={(e) => setForm({ ...form, classNames: e.target.checked ? [...form.classNames, c] : form.classNames.filter((x) => x !== c) })} />
            ))}
          </div>
          {touched && errors.classes && <p className="mt-1 text-[13px] text-danger">{t('validation.pickOne', { ns: 'common' })}</p>}
        </fieldset>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-[16px] font-extrabold text-foreground">{t('exams.pickQuestions', { count: form.questionIds.length })}</h3>
          <p className="text-[13px] text-muted-foreground">{t('exams.pickHint')}</p>
        </div>
        <div className="flex items-end gap-2">
          <Select containerClassName="w-[200px]" label={t('common.topic', { ns: 'common' })} value={topic} onChange={(e) => setTopic(e.target.value)} placeholderOption={t('lessons.allTopics')} options={scope.allTopics.map((v) => ({ value: v, label: v }))} />
          <Button
            variant="soft"
            icon={<Shuffle className="h-4 w-4" aria-hidden />}
            disabled={pool.length === 0}
            onClick={() => setForm({ ...form, questionIds: [...new Set([...form.questionIds, ...[...pool].sort(() => Math.random() - 0.5).slice(0, 5).map((q) => q.id)])] })}
          >
            {t('exams.autoPick')}
          </Button>
        </div>
      </div>
      {touched && errors.questions && <p className="mt-2 text-[13px] text-danger">{t('exams.needQuestions')}</p>}
      <ul className="scrollbar-thin mt-3 max-h-[320px] divide-y divide-border overflow-y-auto rounded-[14px] border border-border">
        {bank.loading && !bank.data && <li className="p-4"><Skeleton className="h-24" /></li>}
        {pool.map((q) => (
          <li key={q.id} className="px-4 py-2.5">
            <Checkbox
              label={<span className="line-clamp-2 font-normal">{q.stem}</span>}
              description={`${q.topic} · ${t(`difficultyShort.${q.difficulty}`, { ns: 'common' })}`}
              checked={form.questionIds.includes(q.id)}
              onChange={(e) => setForm({ ...form, questionIds: e.target.checked ? [...form.questionIds, q.id] : form.questionIds.filter((x) => x !== q.id) })}
            />
          </li>
        ))}
      </ul>
    </Modal>
  );
}
