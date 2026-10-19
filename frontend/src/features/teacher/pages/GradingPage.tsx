import clsx from 'clsx';
import { CheckCircle2, ClipboardCheck, FileText, Paperclip } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { useResourceList } from '@/hooks/useResourceList';
import { homeworkApi, rubricApi, type Submission, submissionApi } from '../services/teacherApi';
import { FileLink } from '@/components/ui/FileLink';

export default function GradingPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const [params] = useSearchParams();
  const lq = useListQuery<'homeworkId' | 'status' | 'className'>({ sort: { key: 'submittedAt', direction: 'desc' }, filters: { homeworkId: params.get('homework') ?? '', status: 'pending' }, descFirst: ['submittedAt'] });
  const list = useResourceList(submissionApi.list, lq.query);
  const homework = useAsync((signal) => homeworkApi.list({ offset: 0, limit: 100 }, signal), []);
  const [grading, setGrading] = useState<Submission | null>(null);

  const columns: Column<Submission>[] = [
    {
      id: 'student',
      header: t('common.student', { ns: 'common' }),
      sortKey: 'studentName',
      rowHeader: true,
      cell: (s) => (
        <span className="flex min-w-[180px] items-center gap-2.5">
          <Avatar name={s.studentName} size={32} />
          <span>
            <span className="block font-semibold text-foreground">{s.studentName}</span>
            <span className="block text-[12.5px] font-normal text-muted-foreground">{s.className}</span>
          </span>
        </span>
      ),
    },
    { id: 'homework', header: t('homework.title'), cell: (s) => s.homeworkTitle },
    { id: 'submittedAt', header: t('grading.submittedAt'), sortKey: 'submittedAt', hideOnMobile: true, cell: (s) => <span className="text-muted-foreground"><RelativeTime iso={s.submittedAt} /></span> },
    { id: 'file', header: t('common.file', { ns: 'common' }), hideOnMobile: true, cell: (s) => (s.attachment ? <span className="inline-flex items-center gap-1 text-[13px]"><Paperclip className="h-3.5 w-3.5" aria-hidden />{s.attachment}</span> : '—') },
    { id: 'status', header: t('common.status', { ns: 'common' }), cell: (s) => (s.status === 'graded' ? <Badge tone="success" dot>{t('grading.graded', { score: s.score ?? 0 })}</Badge> : <Badge tone="warning" dot>{t('grading.pending')}</Badge>) },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (s) => (
        <Button size="sm" variant={s.status === 'pending' ? 'soft' : 'ghost'} icon={<ClipboardCheck className="h-4 w-4" aria-hidden />} onClick={() => setGrading(s)} aria-label={`${t('actions.grade', { ns: 'common' })}: ${s.studentName}, ${s.homeworkTitle}`}>
          {s.status === 'pending' ? t('actions.grade', { ns: 'common' }) : t('actions.edit', { ns: 'common' })}
        </Button>
      ),
    },
  ];

  const next = (after: Submission) => list.items.find((s) => s.status === 'pending' && s.id !== after.id) ?? null;

  return (
    <>
      <PageHeader title={t('nav.teacher.grading', { ns: 'common' })} description={t('grading.description')} />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('grading.searchPlaceholder')}
        filters={[
          { key: 'homeworkId', label: t('homework.title'), value: lq.filters.homeworkId ?? '', allLabel: t('grading.allHomework'), options: (homework.data?.items ?? []).map((h) => ({ value: h.id, label: h.title })) },
          { key: 'status', label: t('common.status', { ns: 'common' }), value: lq.filters.status ?? '', allLabel: t('common.allStatuses', { ns: 'common' }), options: [{ value: 'pending', label: t('grading.pending') }, { value: 'graded', label: t('grading.gradedLabel') }] },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'homeworkId' | 'status', v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('nav.teacher.grading', { ns: 'common' })}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={grading?.id ?? null}
        empty={{ icon: <CheckCircle2 className="h-5 w-5" aria-hidden />, title: t('grading.empty'), description: t('grading.emptyHint') }}
      />
      <GradeDrawer
        submission={grading}
        rubricId={homework.data?.items.find((h) => h.id === grading?.homeworkId)?.rubricId ?? null}
        onClose={() => setGrading(null)}
        onSaved={(saved) => {
          list.updateItem(saved);
          setGrading(next(saved));
        }}
      />
    </>
  );
}

function GradeDrawer({ submission, rubricId, onClose, onSaved }: { submission: Submission | null; rubricId: string | null; onClose: () => void; onSaved: (s: Submission) => void }) {
  const { t } = useTranslation(['teacher', 'common']);
  const rubric = useAsync((signal) => (rubricId ? rubricApi.get(rubricId, signal) : Promise.resolve(null)), [rubricId]);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const { run, busy } = useAction();

  useEffect(() => {
    if (!submission) return;
    setLevels({});
    setScore(submission.score !== null ? String(submission.score) : '');
    setFeedback(submission.feedback);
  }, [submission]);

  const rubricScore = useMemo(() => {
    const r = rubric.data;
    if (!r || r.criteria.some((c) => !levels[c.id])) return null;
    return Math.round(r.criteria.reduce((sum, c) => sum + (c.weight * (levels[c.id] ?? 0)) / c.levels.length, 0));
  }, [rubric.data, levels]);
  const final = rubric.data ? rubricScore : score === '' ? null : Number(score);
  const invalid = final === null || Number.isNaN(final) || final < 0 || final > 100;

  return (
    <Modal
      open={submission !== null}
      onClose={onClose}
      variant="side"
      size="lg"
      preventClose={busy}
      title={submission ? `${submission.studentName} · ${submission.homeworkTitle}` : ''}
      description={submission ? submission.className : undefined}
      footer={
        <Button
          loading={busy}
          disabled={invalid}
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
          onClick={async () => {
            if (!submission || final === null) return;
            const saved = await run(() => submissionApi.update(submission.id, { score: final, feedback: feedback.trim(), status: 'graded' }), { success: t('grading.saved', { name: submission.studentName, score: final }) });
            if (saved) onSaved(saved);
          }}
        >
          {t('grading.saveNext')}
        </Button>
      }
    >
      {submission && (
        <>
          <section aria-labelledby="sub-text" className="rounded-[16px] bg-surface-muted p-4">
            <h3 id="sub-text" className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
              <FileText className="h-4 w-4" aria-hidden />
              {t('grading.answer')} · <RelativeTime iso={submission.submittedAt} />
            </h3>
            <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-foreground">{submission.text}</p>
            {submission.attachment && <FileLink className="mt-3" name={submission.attachment} url={submission.attachmentUrl} />}
          </section>

          {rubric.data ? (
            <section className="mt-5" aria-labelledby="rubric-title">
              <h3 id="rubric-title" className="font-display text-[16px] font-extrabold text-foreground">
                {rubric.data.title}
              </h3>
              <div className="mt-3 space-y-4">
                {rubric.data.criteria.map((c) => (
                  <fieldset key={c.id}>
                    <legend className="text-[14px] font-semibold text-foreground">
                      {c.name} <span className="font-normal text-muted-foreground">({t('rubrics.weightValue', { value: c.weight })})</span>
                    </legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-4">
                      {c.levels.map((l) => (
                        <label key={l.label} className={clsx('cursor-pointer rounded-[12px] border-2 p-2.5 text-[12.5px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring', levels[c.id] === l.points ? 'border-primary bg-accent-soft' : 'border-border hover:border-primary/40')}>
                          <input type="radio" className="sr-only" name={c.id} checked={levels[c.id] === l.points} onChange={() => setLevels({ ...levels, [c.id]: l.points })} />
                          <span className="block font-semibold text-foreground">{l.label}</span>
                          <span className="block text-muted-foreground">{l.description}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
              <p className="mt-4 rounded-[12px] bg-accent-soft px-4 py-3 text-[14.5px] font-semibold text-accent-ink" aria-live="polite">
                {rubricScore === null ? t('grading.pickAll') : t('grading.rubricScore', { score: rubricScore })}
              </p>
            </section>
          ) : (
            <section className="mt-5">
              <Input label={t('grading.score')} type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} hint={t('grading.suggested', { score: submission.suggestedScore })} error={score !== '' && invalid ? t('validation.max', { ns: 'common' }) : undefined} />
              <Button className="mt-2" size="sm" variant="ghost" onClick={() => setScore(String(submission.suggestedScore))}>
                {t('grading.useSuggested')}
              </Button>
            </section>
          )}
          <Textarea containerClassName="mt-5" label={t('common.feedback', { ns: 'common' })} rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={t('grading.feedbackPlaceholder')} />
        </>
      )}
    </Modal>
  );
}
