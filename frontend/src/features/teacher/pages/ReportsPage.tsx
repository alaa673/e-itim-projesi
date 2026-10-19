import clsx from 'clsx';
import { Download, FileBarChart2, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HBars } from '@/components/charts/HBars';
import { scoreTone } from '@/components/charts/scoreTone';
import { TopicBars } from '@/components/charts/TopicBars';
import { PageHeader } from '@/components/layout/PageHeader';
import { PusulaLogo } from '@/components/brand/PusulaLogo';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { AsyncContent, EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { TOPIC_REVIEW_THRESHOLD } from '@/config/constants';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { useParam } from '@/hooks/useOpenParam';
import { downloadCsv } from '@/utils/csv';
import { formatDate, formatPercent } from '@/utils/format';
import { classReport } from '../services/teacherApi';
import { useTeachingScope } from '../hooks/useTeachingScope';

export default function ReportsPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const locale = useLocale();
  const [cls, setCls] = useParam('class');
  const scope = useTeachingScope();
  const className = cls || scope.classNames[0] || '';
  const report = useAsync((signal) => (className ? classReport(className, signal) : Promise.resolve(null)), [className]);

  return (
    <>
      <div className="no-print">
        <PageHeader
          title={t('nav.teacher.reports', { ns: 'common' })}
          description={t('reports.description')}
          actions={
            <>
              <Button
                variant="secondary"
                icon={<Download className="h-4 w-4" aria-hidden />}
                disabled={!report.data}
                onClick={() =>
                  report.data &&
                  downloadCsv(`pusula-${className}-raporu`, [
                    [t('common.student', { ns: 'common' }), t('reports.number'), t('reports.last'), t('reports.average'), t('reports.weakest')],
                    ...report.data.students.map((s) => [s.name, s.schoolNumber, s.lastScore ?? '', s.average, s.weakTopic ? `${s.weakTopic.name} (${s.weakTopic.percent})` : '']),
                  ])
                }
              >
                {t('actions.exportCsv', { ns: 'common' })}
              </Button>
              <Button variant="ink" icon={<Printer className="h-4 w-4" aria-hidden />} disabled={!report.data} onClick={() => window.print()}>
                {t('reports.print')}
              </Button>
            </>
          }
        />
        <div className="panel mb-6 flex flex-wrap items-end gap-4 p-4">
          <Select containerClassName="w-[220px]" label={t('common.class', { ns: 'common' })} value={className} onChange={(e) => setCls(e.target.value)} options={scope.classNames.map((c) => ({ value: c, label: c }))} />
          <p className="pb-2 text-[13px] text-muted-foreground">{t('reports.printHint')}</p>
        </div>
      </div>

      {scope.error ? (
        <div className="panel">
          <ErrorState error={scope.error} onRetry={scope.retry} />
        </div>
      ) : !scope.loading && scope.classNames.length === 0 ? (
        <div className="panel">
          <EmptyState title={t('reports.noClasses')} />
        </div>
      ) : (
      <AsyncContent data={report.data} error={report.error} loading={report.loading} reload={report.reload} skeleton={<Skeleton className="h-[640px] rounded-panel" />}>
        {(r) => (
          <article className="print-area panel p-6 sm:p-8" aria-labelledby="report-title">
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <PusulaLogo size="sm" tone="dark" />
                <h2 id="report-title" className="mt-4 font-display text-[26px] font-extrabold text-foreground">
                  {t('reports.title', { cls: r.className })}
                </h2>
                <p className="text-[14px] text-muted-foreground">
                  {r.subject} · {r.teacher} · {t('common.students', { ns: 'common', count: r.studentCount })}
                </p>
              </div>
              <p className="text-right text-[13px] text-muted-foreground">
                {t('reports.generated')}
                <br />
                <span className="font-semibold text-foreground">{formatDate(r.generatedAt, locale, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </p>
            </header>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Panel icon={FileBarChart2} title={t('reports.topics')} className="shadow-none">
                <TopicBars data={r.topics.map((tp) => ({ id: tp.name, label: tp.name, percent: tp.percent }))} threshold={TOPIC_REVIEW_THRESHOLD} thresholdLabel={t('classes.threshold', { value: TOPIC_REVIEW_THRESHOLD })} reviewLabel={t('classes.review')} />
              </Panel>
              <Panel title={t('reports.distribution')} description={t('reports.classAverage', { value: formatPercent(r.average, locale) })} className="shadow-none">
                <HBars ariaLabel={t('reports.distribution')} data={r.distribution.map((d) => ({ id: d.range, label: d.range, value: d.count, display: t('common.students', { ns: 'common', count: d.count }) }))} />
              </Panel>
            </div>

            <h3 className="mt-8 font-display text-[18px] font-extrabold text-foreground">{t('reports.students')}</h3>
            <div className="mt-3 relative overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-[14px]">
                <caption className="sr-only">{t('reports.students')}</caption>
                <thead className="bg-surface-muted text-[13px] text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">{t('common.student', { ns: 'common' })}</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">{t('reports.number')}</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t('reports.last')}</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t('reports.average')}</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">{t('reports.weakest')}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.students.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0 break-inside-avoid">
                      <th scope="row" className="px-4 py-2 font-semibold text-foreground">{s.name}</th>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{s.schoolNumber}</td>
                      <td className={clsx('px-3 py-2 text-right tabular-nums', s.lastScore !== null && scoreTone(s.lastScore) === 'danger' && 'font-semibold text-danger')}>{s.lastScore === null ? t('reports.notTaken') : formatPercent(s.lastScore, locale)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatPercent(s.average, locale)}</td>
                      <td className="px-4 py-2">{s.weakTopic ? `${s.weakTopic.name} · ${formatPercent(s.weakTopic.percent, locale)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-[12px] text-muted-foreground">{t('reports.footer')}</p>
          </article>
        )}
      </AsyncContent>
      )}
    </>
  );
}
