import clsx from 'clsx';
import { ArrowRight, BarChart3, BookMarked, CheckCircle2, Circle, FileText, Hourglass, Medal, RotateCcw, Trophy, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LineChart } from '@/components/charts/LineChart';
import { Meter } from '@/components/charts/Meter';
import { TopicBars } from '@/components/charts/TopicBars';
import { StatTile } from '@/components/dashboard/StatTile';
import { PageHeader } from '@/components/layout/PageHeader';
import { DueLabel } from '@/components/layout/RelativeTime';
import { Badge } from '@/components/ui/Badge';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { ErrorState, PageSkeleton } from '@/components/ui/States';
import { TOPIC_REVIEW_THRESHOLD } from '@/config/constants';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { useParam } from '@/hooks/useOpenParam';
import { formatDate, formatPercent } from '@/utils/format';
import { studentPortalService } from '../services/studentPortalService';

export default function ProgressPage() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const { data, error, loading, reload } = useAsync((signal) => studentPortalService.getProgress(locale, signal), [locale]);
  const [subjectParam, setSubjectParam] = useParam('subject');

  const header = <PageHeader title={t('progress.title')} description={t('progress.description')} />;

  if (!data) {
    return (
      <>
        {header}
        {error && !loading ? <Panel><ErrorState error={error} onRetry={reload} /></Panel> : <PageSkeleton />}
      </>
    );
  }

  const scores = data.timeline.map((p) => p.score);
  const last = scores[scores.length - 1];
  const prev = scores[scores.length - 2];
  const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const allTopics = data.subjects.flatMap((s) => s.topics);
  const reviewCount = allTopics.filter((tp) => tp.percent < 60).length;
  const subject = data.subjects.find((s) => s.name === subjectParam) ?? data.subjects[0];
  const chartValues = data.timeline.flatMap((p) => [p.score, p.classAverage]);
  const chartMin = Math.max(0, Math.floor((Math.min(...chartValues, 100) - 8) / 10) * 10);
  const chartMax = Math.min(100, Math.ceil((Math.max(...chartValues, 0) + 8) / 10) * 10);
  const goalsDone = data.goals.filter((g) => g.done).length;

  return (
    <>
      {header}

      <section aria-label={t('progress.summaryLabel')} className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatTile variant="plain" icon={BarChart3} tone="violet" label={t('progress.summary.average', { count: scores.length })} value={average} />
        <StatTile
          variant="plain"
          icon={prev === undefined || last >= prev ? Trophy : Medal}
          tone={prev === undefined || last >= prev ? 'peach' : 'sky'}
          label={t('progress.summary.last')}
          value={last ?? '—'}
          delta={prev === undefined ? undefined : { value: t('progress.summary.delta', { value: Math.abs(last - prev) }), up: last >= prev, label: t('progress.summary.vsPrevious') }}
        />
        <StatTile variant="plain" icon={RotateCcw} tone="peach" label={t('progress.summary.review')} value={reviewCount} />
        <StatTile variant="plain" icon={BookMarked} tone="mint" label={t('progress.summary.mistakes')} value={data.mistakesCount} to="/student/mistakes" />
      </section>

      <Panel className="mt-6" title={t('progress.timeline.title')} description={t('progress.timeline.description')}>
        <LineChart
          ariaLabel={t('progress.timeline.aria')}
          labels={data.timeline.map((p) => p.label)}
          tooltipLabels={data.timeline.map((p) => `${p.label} · ${formatDate(p.date, locale, { day: 'numeric', month: 'short' })}`)}
          formatValue={(v) => String(v)}
          min={chartMin}
          max={chartMax}
          series={[
            { id: 'me', name: t('progress.timeline.me'), color: 'rgb(var(--chart-emphasis))', values: data.timeline.map((p) => p.score), emphasis: true },
            { id: 'class', name: t('progress.timeline.class'), color: 'rgb(var(--muted-foreground) / 0.7)', values: data.timeline.map((p) => p.classAverage) },
          ]}
        />
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title={t('progress.topics.title')}
          description={t('progress.topics.description')}
          action={
            <Select
              containerClassName="w-[220px]"
              label={t('progress.topics.subject')}
              hideLabel
              value={subject?.name ?? ''}
              onChange={(e) => setSubjectParam(e.target.value)}
              options={data.subjects.map((s) => ({ value: s.name, label: s.name }))}
            />
          }
        >
          <TopicBars
            threshold={TOPIC_REVIEW_THRESHOLD}
            thresholdLabel={t('progress.topics.threshold', { value: TOPIC_REVIEW_THRESHOLD })}
            reviewLabel={t('progress.topics.review')}
            previousLabel={t('progress.topics.previous')}
            data={[...subject.topics]
              .sort((a, b) => a.percent - b.percent)
              .map((tp) => ({
                id: tp.topicId,
                label: tp.name,
                percent: tp.percent,
                previous: tp.previous,
                detail:
                  tp.previous == null
                    ? t('progress.topics.firstTime')
                    : t(tp.percent >= tp.previous ? 'progress.topics.improved' : 'progress.topics.dropped', { value: Math.abs(tp.percent - tp.previous) }),
              }))}
          />
          <Link to={`/student/practice?subject=${encodeURIComponent(subject?.name ?? '')}`} className={buttonClass('soft', 'sm', 'mt-5')}>
            {t('progress.topics.practice')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Panel>

        <div className="space-y-6 xl:col-span-2">
          <Panel title={t('progress.support.title')} description={t('progress.support.description')} bodyClassName="px-0 pb-2">
            <ul>
              {data.supportExercises.map((ex) => (
                <li key={ex.id} className="border-t border-border px-5 py-3.5 first:border-t-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{ex.topic}</p>
                      <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                        {ex.subject} · {t('progress.support.questions', { count: ex.questionCount })} · {t(`difficulty.${ex.difficulty}`, { ns: 'common' })}
                        {ex.includesSummary && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle">
                            · <FileText className="h-3 w-3" aria-hidden /> {t('progress.support.withSummary')}
                          </span>
                        )}
                      </p>
                    </div>
                    {ex.status === 'pending' ? (
                      <Badge tone="warning" icon={<Hourglass className="h-3 w-3" aria-hidden />}>
                        {t('progress.support.pending')}
                      </Badge>
                    ) : (
                      <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" aria-hidden />}>
                        {t('progress.support.completed')}
                      </Badge>
                    )}
                  </div>
                  {ex.status === 'completed' && ex.after !== null ? (
                    <p className="mt-2 flex items-center gap-2 text-[13px]">
                      <span className="tabular-nums text-muted-foreground">{formatPercent(ex.before, locale)}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      <span className="font-semibold tabular-nums text-foreground">{formatPercent(ex.after, locale)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-achievement-soft px-2 py-0.5 font-semibold text-achievement-ink">
                        <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                        {t('progress.support.gain', { value: ex.after - ex.before })}
                      </span>
                    </p>
                  ) : (
                    ex.due && (
                      <p className="mt-2 text-[13px] text-muted-foreground">
                        {t('progress.support.due')} <span className="font-medium text-foreground"><DueLabel iso={ex.due} /></span>
                      </p>
                    )
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={t('progress.goals.title')} description={t('progress.goals.description', { done: goalsDone, total: data.goals.length })}>
            <Meter className="mb-4" size="lg" tone="achievement" value={goalsDone} max={data.goals.length} label={t('progress.goals.title')} />
            <ul className="space-y-2.5">
              {data.goals.map((goal) => (
                <li key={goal.id} className="flex items-start gap-2.5 text-sm">
                  {goal.done ? (
                    <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-success" aria-label={t('progress.goals.done')} />
                  ) : (
                    <Circle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-input" aria-label={t('progress.goals.open')} />
                  )}
                  <span className={clsx(goal.done ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground')}>{goal.label}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
