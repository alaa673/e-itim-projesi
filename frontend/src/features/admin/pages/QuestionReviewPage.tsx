import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, ChevronRight, FileSearch, ImageIcon, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Meter } from '@/components/charts/Meter';
import { ListFooter } from '@/components/data/ResourceTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useParam } from '@/hooks/useOpenParam';
import { useResourceList } from '@/hooks/useResourceList';
import type { Difficulty, ExamType, ReviewQuestion } from '@/types';
import { archiveFileApi, archiveSubjects, lookupApi, reviewApi } from '../services/adminApi';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const strip = (o: string) => o.replace(/^[A-E]\)\s*/, '');
type Status = ReviewQuestion['status'];

interface Draft {
  stem: string;
  options: string[];
  answer: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
}

export default function QuestionReviewPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [fileId, setFileId] = useParam('file');
  const [status, setStatus] = useState<Status>('pending');
  const query = useMemo(() => ({ filters: { fileId, status }, sortKey: 'number' }), [fileId, status]);
  const list = useResourceList(reviewApi.list, query);
  const subjectsByExam = useAsync(() => archiveSubjects(), []);
  const catalog = useAsync((s) => lookupApi.subjects(s), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const { run, busy } = useAction();

  const selected = list.items.find((q) => q.id === selectedId) ?? null;
  useEffect(() => {
    if (!selected && list.items.length) setSelectedId(list.items[0].id);
  }, [list.items, selected]);
  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({ stem: selected.stem, options: selected.options.map(strip), answer: selected.answer, subject: selected.subject, topic: selected.topic, difficulty: 'medium' });
  }, [selected]);

  const fileList = useAsync((signal) => archiveFileApi.list({ offset: 0, limit: 100, filters: { kind: 'questions' }, sortKey: 'uploadedAt', sortDirection: 'desc' }, signal), []);
  const files = (fileList.data?.items ?? []).filter((f) => f.status === 'review' || f.status === 'done').map((f) => [f.id, f.fileName] as const);

  const topics = useMemo(() => {
    const s = catalog.data?.find((x) => x.name === draft?.subject);
    const names = s ? s.units.flatMap((u) => u.topics.map((tp) => tp.name)) : [];
    if (draft?.topic && !names.includes(draft.topic)) names.unshift(draft.topic);
    return names;
  }, [catalog.data, draft?.subject, draft?.topic]);

  const goNext = (afterId: string) => {
    const idx = list.items.findIndex((q) => q.id === afterId);
    const next = list.items.slice(idx + 1).find((q) => q.status === 'pending') ?? list.items.find((q) => q.status === 'pending' && q.id !== afterId);
    list.refresh();
    setSelectedId(next?.id ?? null);
  };

  const approve = async () => {
    if (!selected || !draft) return;
    const ok = await run(
      () => reviewApi.approve(selected.id, { ...draft, options: draft.options.map((o, i) => `${LETTERS[i]}) ${o}`) }),
      { success: t('review.approved', { number: selected.number }) },
    );
    if (ok) goNext(selected.id);
  };
  const reject = async () => {
    if (!selected) return;
    const ok = await run(() => reviewApi.reject(selected.id), { success: t('review.rejected', { number: selected.number }) });
    if (ok) goNext(selected.id);
  };

  const subjectOptions = selected ? (subjectsByExam.data?.[selected.examType as ExamType] ?? [selected.subject]) : [];
  const invalid = draft ? !draft.stem.trim() || draft.options.some((o) => !o.trim()) : true;

  return (
    <>
      <PageHeader title={t('review.title')} description={t('review.description')} />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <Tabs<Status>
          label={t('review.statusLabel')}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setSelectedId(null);
          }}
          items={(['pending', 'approved', 'rejected'] as const).map((v) => ({ value: v, label: t(`review.status.${v}`), count: v === status ? list.total : undefined }))}
        />
        <Select
          containerClassName="md:w-[300px]"
          label={t('review.file')}
          value={fileId}
          highlight={Boolean(fileId)}
          onChange={(e) => {
            setFileId(e.target.value);
            setSelectedId(null);
          }}
          placeholderOption={t('review.allFiles')}
          options={files.map(([id, name]) => ({ value: id, label: name }))}
        />
      </div>

      {list.status === 'error' ? (
        <div className="panel">
          <ErrorState error={list.error} onRetry={list.retry} />
        </div>
      ) : list.status === 'loading' && list.items.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Skeleton className="h-[520px] rounded-panel" />
          <Skeleton className="h-[520px] rounded-panel" />
        </div>
      ) : list.items.length === 0 ? (
        <div className="panel">
          <EmptyState icon={<FileSearch className="h-5 w-5" aria-hidden />} title={t(status === 'pending' ? 'review.emptyPending' : 'review.empty')} description={status === 'pending' ? t('review.emptyPendingHint') : undefined} />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="panel h-fit overflow-hidden">
            <ul className="scrollbar-thin max-h-[640px] overflow-y-auto p-2" aria-label={t('review.listLabel')}>
              {list.items.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(q.id)}
                    aria-current={q.id === selectedId ? 'true' : undefined}
                    className={clsx('flex w-full items-start gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors', q.id === selectedId ? 'bg-accent-soft' : 'hover:bg-surface-muted')}
                  >
                    <span className="mt-0.5 flex h-7 min-w-7 items-center justify-center rounded-[8px] bg-surface-muted px-1.5 text-[12.5px] font-bold tabular-nums text-foreground">{q.number}</span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[13.5px] text-foreground">{q.stem}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
                        {q.topic}
                        {q.confidence < 80 && <Badge tone="warning">{t('review.lowConfidence')}</Badge>}
                        {q.hasFigure && <ImageIcon className="h-3.5 w-3.5" aria-label={t('review.hasFigure')} />}
                      </span>
                    </span>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <ListFooter list={list} />
          </div>

          {selected && draft && (
            <Panel
              title={t('review.questionTitle', { number: selected.number })}
              description={`${selected.fileName} · ${selected.examType} ${selected.year}`}
              action={
                <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  {t('review.confidence')}
                  <Meter className="w-20" value={selected.confidence} tone="score" label={t('review.confidence')} />
                  <span className="tabular-nums">{t('common.percentValue', { ns: 'common', value: selected.confidence })}</span>
                </span>
              }
            >
              {selected.hasFigure && (
                <p className="mb-4 flex gap-2 rounded-[12px] bg-warning/[0.1] p-3 text-[13.5px] text-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  {t('review.figureWarning')}
                </p>
              )}
              <fieldset disabled={selected.status !== 'pending'} className="space-y-4">
                <Textarea label={t('review.stem')} rows={3} value={draft.stem} onChange={(e) => setDraft({ ...draft, stem: e.target.value })} error={!draft.stem.trim() ? t('validation.required', { ns: 'common' }) : undefined} />
                <div>
                  <p className="field-label">{t('review.options')}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {draft.options.map((o, i) => (
                      <Input
                        key={i}
                        label={t('review.option', { letter: LETTERS[i] })}
                        hideLabel
                        value={o}
                        leading={<span className="text-[13px] font-bold">{LETTERS[i]})</span>}
                        onChange={(e) => setDraft({ ...draft, options: draft.options.map((x, j) => (j === i ? e.target.value : x)) })}
                        error={!o.trim() ? t('validation.required', { ns: 'common' }) : undefined}
                      />
                    ))}
                  </div>
                </div>
                <SegmentedControl
                  label={t('common.answer', { ns: 'common' })}
                  value={draft.answer}
                  onChange={(v) => setDraft({ ...draft, answer: v })}
                  options={draft.options.map((_, i) => ({ value: LETTERS[i], label: LETTERS[i] }))}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Select
                    label={t('common.subject', { ns: 'common' })}
                    value={draft.subject}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value, topic: '' })}
                    options={subjectOptions.map((s) => ({ value: s, label: s }))}
                  />
                  <Select
                    label={t('common.topic', { ns: 'common' })}
                    value={draft.topic}
                    onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
                    placeholderOption={t('common.selectPlaceholder', { ns: 'common' })}
                    options={topics.map((s) => ({ value: s, label: s }))}
                  />
                  <Select
                    label={t('common.difficulty', { ns: 'common' })}
                    value={draft.difficulty}
                    onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Difficulty })}
                    options={(['easy', 'medium', 'hard'] as const).map((d) => ({ value: d, label: t(`difficultyShort.${d}`, { ns: 'common' }) }))}
                  />
                </div>
              </fieldset>
              {selected.status === 'pending' ? (
                <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-4">
                  <Button variant="secondary" className="text-danger" icon={<XCircle className="h-4 w-4" aria-hidden />} disabled={busy} onClick={() => void reject()}>
                    {t('actions.reject', { ns: 'common' })}
                  </Button>
                  <Button variant="ink" loading={busy} disabled={invalid || !draft.topic} icon={<CheckCircle2 className="h-4 w-4" aria-hidden />} onClick={() => void approve()}>
                    {t('review.approveNext')}
                  </Button>
                </div>
              ) : (
                <p className="mt-6 border-t border-border pt-4 text-[13.5px] text-muted-foreground">{t(`review.done.${selected.status}`)}</p>
              )}
            </Panel>
          )}
        </div>
      )}
    </>
  );
}
