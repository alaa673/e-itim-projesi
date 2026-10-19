import clsx from 'clsx';
import { AlertTriangle, BarChart3, Filter, Search, Send, TrendingDown, TrendingUp, UserCheck, UserX, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { HEAT_LEGEND, heatStyle } from '@/components/charts/scoreScale';
import { TopicBars } from '@/components/charts/TopicBars';
import { StatTile } from '@/components/dashboard/StatTile';
import type { Tone } from '@/components/dashboard/tones';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { type Column, DataTable, LoadMoreBar } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { SEARCH_DEBOUNCE_MS, TOPIC_REVIEW_THRESHOLD } from '@/config/constants';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useIncrementalList } from '@/hooks/useIncrementalList';
import { useLocale } from '@/hooks/useLocale';
import type { ExamResult } from '@/types';
import { formatDate, formatPercent } from '@/utils/format';
import { scrollBehavior } from '@/utils/motion';
import { type SupportTarget, SupportExerciseModal } from '../components/SupportExerciseModal';
import { teacherService } from '../services/teacherService';
import type { ExamAnalysis, ResultListFilters } from '../types';

const DEFAULT_EXAM = 'exam-8a-u2';

export default function ResultsAnalysisPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const locale = useLocale();
  const [params, setParams] = useSearchParams();
  const examId = params.get('exam') ?? DEFAULT_EXAM;
  const tableRef = useRef<HTMLDivElement>(null);

  const exams = useAsync((signal) => teacherService.listExams(locale, signal), [locale]);
  const analysis = useAsync((signal) => teacherService.getExamAnalysis(examId, locale, signal), [examId, locale]);

  const [filters, setFilters] = useState<ResultListFilters>({ search: '', sortKey: 'score', sortDirection: 'desc', weakTopicId: '' });
  const debouncedSearch = useDebounce(filters.search, SEARCH_DEBOUNCE_MS);
  const query = useMemo(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch]);
  const list = useIncrementalList<ExamResult>(
    (page, signal) => teacherService.listExamResults(examId, query, page, signal),
    (r) => r.studentId,
    JSON.stringify({ examId, query }),
  );

  const [supportTarget, setSupportTarget] = useState<SupportTarget | null>(null);
  const data: ExamAnalysis | null = analysis.data?.exam.id === examId ? analysis.data : null;

  const selectExam = (id: string) => {
    setParams(id === DEFAULT_EXAM ? {} : { exam: id }, { replace: true });
    setFilters((f) => ({ ...f, weakTopicId: '', search: '' }));
  };

  const showStrugglers = (topicId: string) => {
    setFilters((f) => ({ ...f, weakTopicId: topicId }));
    tableRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  };

  const openSupport = (row: ExamResult, topicId?: string) => {
    if (!data) return;
    const weakest = [...row.topics].sort((a, b) => a.percent - b.percent)[0];
    setSupportTarget({
      studentId: row.studentId,
      studentName: row.studentName,
      className: data.exam.className,
      topics: data.exam.topics.map((tp) => ({ id: tp.id, name: tp.name, percent: row.topics.find((s) => s.topicId === tp.id)?.percent ?? null })),
      initialTopicId: topicId ?? weakest?.topicId ?? data.exam.topics[0].id,
    });
  };

  const sortedTopics = data ? [...data.topicAverages].sort((a, b) => a.percent - b.percent) : [];
  const hardest = sortedTopics[0];

  const topicColumns: Column<ExamResult>[] = (data?.exam.topics ?? []).map((topic) => ({
    id: `topic-${topic.id}`,
    header: topic.name,
    align: 'center',
    hideOnMobile: true,
    headerClassName: clsx('max-w-[96px] whitespace-normal leading-tight', filters.weakTopicId === topic.id && 'text-accent-ink'),
    cell: (row) => {
      const score = row.topics.find((s) => s.topicId === topic.id);
      if (!score) return <span className="text-muted-foreground">—</span>;
      const weak = score.percent < TOPIC_REVIEW_THRESHOLD;
      const label = `${row.studentName}, ${topic.name}: ${formatPercent(score.percent, locale)} (${score.correct}/${score.total})`;
      const chip = (
        <span className="inline-flex min-w-[46px] justify-center rounded-[6px] px-1.5 py-1 text-[13px] font-semibold tabular-nums" style={heatStyle(score.percent)}>
          {score.percent}
        </span>
      );
      return weak ? (
        <button
          type="button"
          onClick={() => openSupport(row, topic.id)}
          title={`${label} — ${t('results.sendSupport')}`}
          aria-label={`${label}. ${t('results.sendSupport')}`}
          className="rounded-[8px] p-0.5 outline-offset-1 transition-shadow hover:ring-2 hover:ring-ring/70"
        >
          {chip}
        </button>
      ) : (
        <span title={label}>{chip}</span>
      );
    },
  }));

  const columns: Column<ExamResult>[] = [
    {
      id: 'student',
      header: t('results.columns.student'),
      sortKey: 'name',
      rowHeader: true,
      cell: (row) => (
        <div className="min-w-[150px]">
          <p className="font-semibold text-foreground">{row.studentName}</p>
          <p className="text-[12.5px] text-muted-foreground">{row.schoolNumber}</p>
        </div>
      ),
    },
    {
      id: 'score',
      header: t('results.columns.score'),
      sortKey: 'score',
      align: 'right',
      cell: (row) =>
        row.completed ? (
          <span className="font-display text-[17px] font-semibold tabular-nums text-foreground">{row.score}</span>
        ) : (
          <Badge tone="neutral" icon={<UserX className="h-3.5 w-3.5" aria-hidden />}>
            {t('results.notCompleted')}
          </Badge>
        ),
    },
    {
      id: 'dyb',
      header: t('results.columns.answers'),
      align: 'center',
      cell: (row) =>
        row.completed ? (
          <span className="whitespace-nowrap text-[13px] tabular-nums" aria-label={t('results.answersAria', { correct: row.correct, wrong: row.wrong, blank: row.blank })}>
            <span className="font-semibold text-success">{row.correct}</span>
            <span className="text-muted-foreground"> / </span>
            <span className="font-semibold text-danger">{row.wrong}</span>
            <span className="text-muted-foreground"> / {row.blank}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    ...topicColumns,
    {
      id: 'weakest',
      header: t('results.columns.weakest'),
      headerClassName: 'md:hidden',
      className: 'md:hidden',
      cell: (row) => {
        const weakest = [...row.topics].sort((a, b) => a.percent - b.percent)[0];
        const name = data?.exam.topics.find((tp) => tp.id === weakest?.topicId)?.name;
        return weakest ? (
          <span className="whitespace-nowrap text-[13px]">
            {name} <span className="ml-1 rounded-[6px] px-1.5 py-0.5 font-semibold tabular-nums" style={heatStyle(weakest.percent)}>{weakest.percent}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: 'action',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (row) => (
        <Button
          size="sm"
          variant="secondary"
          disabled={!row.completed}
          icon={<Send className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => openSupport(row)}
          aria-label={`${t('results.sendSupport')}: ${row.studentName}`}
        >
          {t('results.sendSupportShort')}
        </Button>
      ),
    },
  ];

  const weakTopicName = data?.exam.topics.find((tp) => tp.id === filters.weakTopicId)?.name;

  return (
    <>
      <PageHeader
        title={t('results.title')}
        description={t('results.description')}
        actions={
          <Select
            label={t('results.exam')}
            hideLabel
            containerClassName="w-full min-w-[260px] sm:w-auto"
            value={examId}
            onChange={(e) => selectExam(e.target.value)}
            disabled={!exams.data}
            options={(exams.data ?? []).map((ex) => ({ value: ex.id, label: `${ex.className} · ${ex.subject} · ${ex.title}` }))}
            placeholderOption={exams.data ? undefined : t('states.loading', { ns: 'common' })}
          />
        }
      />

      {analysis.error && !analysis.loading && !data ? (
        <Panel>
          <ErrorState error={analysis.error} onRetry={analysis.reload} />
        </Panel>
      ) : !data ? (
        <div className="space-y-6" role="status" aria-label={t('states.loading', { ns: 'common' })}>
          <Skeleton className="h-[92px] rounded-panel" />
          <Skeleton className="h-[320px] rounded-panel" />
        </div>
      ) : (
        <>
          <section aria-label={t('results.summaryLabel')} className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-4">
            {(
              [
                { label: t('results.summary.average'), value: data.average, icon: BarChart3, tone: 'violet' },
                { label: t('results.summary.completed'), value: `${data.completed}/${data.assigned}`, icon: UserCheck, tone: 'sky' },
                { label: t('results.summary.highest'), value: data.highest, icon: TrendingUp, tone: 'mint' },
                { label: t('results.summary.lowest'), value: data.lowest, icon: TrendingDown, tone: 'peach' },
              ] satisfies { label: string; value: string | number; icon: typeof BarChart3; tone: Exclude<Tone, 'role' | 'neutral'> }[]
            ).map((item) => (
              <StatTile key={item.label} variant="plain" label={item.label} value={item.value} icon={item.icon} tone={item.tone} />
            ))}
            {hardest && (
              <div className="panel col-span-full flex flex-wrap items-center gap-x-4 gap-y-3 border-danger/25 bg-[linear-gradient(110deg,rgb(var(--danger)/0.09),rgb(var(--surface))_55%)] px-5 py-4">
                <span className="icon-tile h-12 w-12 bg-danger/[0.12] text-danger ring-1 ring-inset ring-danger/20">
                  <AlertTriangle className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-muted-foreground">{t('results.summary.hardest')}</p>
                  <p className="mt-0.5 font-display text-[19px] font-semibold text-foreground">
                    {hardest.name} · <span className="text-danger">{formatPercent(hardest.percent, locale)}</span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="soft"
                  icon={<Filter className="h-3.5 w-3.5" aria-hidden />}
                  onClick={() => showStrugglers(hardest.topicId)}
                  aria-label={t('results.topics.showStrugglersAria', { topic: hardest.name })}
                >
                  {t('results.topics.showStrugglers')}
                </Button>
              </div>
            )}
          </section>
          <p className="mt-3 text-[13px] text-muted-foreground">
            {data.exam.className} · {data.exam.subject} · {formatDate(data.exam.date, locale, { day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
            {t('results.questionCount', { count: data.exam.questionCount })}
            {data.notCompleted.length > 0 && (
              <>
                {' · '}
                <span className="font-medium text-foreground">{t('results.notCompletedList', { count: data.notCompleted.length, names: data.notCompleted.map((n) => n.studentName).join(', ') })}</span>
              </>
            )}
          </p>

          <Panel className="mt-6" title={t('results.topics.title')} description={t('results.topics.description')}>
            <TopicBars
              threshold={TOPIC_REVIEW_THRESHOLD}
              thresholdLabel={t('results.topics.threshold', { value: TOPIC_REVIEW_THRESHOLD })}
              reviewLabel={t('results.topics.review')}
              data={sortedTopics.map((topic) => ({
                id: topic.topicId,
                label: topic.name,
                percent: topic.percent,
                detail: t('results.topics.below', { count: topic.belowThreshold, threshold: TOPIC_REVIEW_THRESHOLD }),
                action:
                  topic.belowThreshold > 0 ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-accent-ink"
                      icon={<Filter className="h-3.5 w-3.5" aria-hidden />}
                      onClick={() => showStrugglers(topic.topicId)}
                      aria-label={t('results.topics.showStrugglersAria', { topic: topic.name })}
                    >
                      <span className="hidden sm:inline">{t('results.topics.showStrugglers')}</span>
                    </Button>
                  ) : undefined,
              }))}
            />
          </Panel>

          <div ref={tableRef} className="scroll-mt-24 pt-8">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="section-title">{t('results.table.title')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('results.table.description')}</p>
              </div>
              <ul className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground" aria-label={t('results.legend')}>
                {HEAT_LEGEND.map((item) => (
                  <li key={item.step} className="rounded-[5px] px-1.5 py-0.5 font-semibold tabular-nums" style={heatStyle([20, 42, 60, 77, 92][item.step - 1])}>
                    {item.range}
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel mb-4 grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,280px)] sm:items-end">
              <Input
                type="search"
                label={t('results.table.search')}
                placeholder={t('results.table.searchPlaceholder')}
                leading={<Search className="h-4 w-4" aria-hidden />}
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
              <Select
                label={t('results.table.weakFilter')}
                highlight={Boolean(filters.weakTopicId)}
                value={filters.weakTopicId}
                onChange={(e) => setFilters((f) => ({ ...f, weakTopicId: e.target.value }))}
                placeholderOption={t('results.table.allStudents')}
                options={data.exam.topics.map((tp) => ({ value: tp.id, label: t('results.table.belowIn', { topic: tp.name, threshold: TOPIC_REVIEW_THRESHOLD }) }))}
              />
            </div>
            {weakTopicName && (
              <div className="mb-3 flex items-center gap-2">
                <Badge tone="accent">{t('results.table.activeFilter', { topic: weakTopicName, threshold: TOPIC_REVIEW_THRESHOLD })}</Badge>
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, weakTopicId: '' }))}
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" aria-hidden /> {t('actions.clearFilters', { ns: 'common' })}
                </button>
              </div>
            )}

            <DataTable
              caption={t('results.table.title')}
              columns={columns}
              rows={list.items}
              getRowId={(r) => r.studentId}
              status={list.status}
              error={list.error}
              onRetry={list.retry}
              sort={{ key: filters.sortKey, direction: filters.sortDirection }}
              onSortChange={(key) =>
                setFilters((f) => ({
                  ...f,
                  sortKey: key as ResultListFilters['sortKey'],
                  sortDirection: f.sortKey === key ? (f.sortDirection === 'asc' ? 'desc' : 'asc') : key === 'score' ? 'desc' : 'asc',
                }))
              }
              rowClassName={(r) => (!r.completed ? 'bg-foreground/[0.02]' : undefined)}
              selectedRowId={supportTarget?.studentId ?? null}
              empty={<EmptyState title={t('states.noResults', { ns: 'common' })} description={t('states.noResultsHint', { ns: 'common' })} />}
              footer={
                <LoadMoreBar
                  shown={list.items.length}
                  total={list.total}
                  hasMore={list.hasMore}
                  nextBatchSize={list.nextBatchSize}
                  status={list.status}
                  error={list.error}
                  onLoadMore={list.loadMore}
                  onRetry={list.retry}
                />
              }
            />
          </div>
        </>
      )}

      <SupportExerciseModal target={supportTarget} onClose={() => setSupportTarget(null)} />
    </>
  );
}
