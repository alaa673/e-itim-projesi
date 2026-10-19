import { History, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HBars } from '@/components/charts/HBars';
import { LineChart } from '@/components/charts/LineChart';
import { StatTile } from '@/components/dashboard/StatTile';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { formatDate, formatNumber } from '@/utils/format';
import { mockHistoryApi } from '../services/studentApi';

export default function MockHistoryPage() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const { data, error, loading, reload } = useAsync((signal) => mockHistoryApi.list({ offset: 0, limit: 100, sortKey: 'date' }, signal), []);
  const n = (v: number) => formatNumber(v, locale, { maximumFractionDigits: 2 });

  return (
    <>
      <PageHeader title={t('nav.student.mockHistory', { ns: 'common' })} description={t('history.description')} />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(page) => {
          const items = page.items;
          if (items.length === 0)
            return (
              <div className="panel">
                <EmptyState icon={<History className="h-5 w-5" aria-hidden />} title={t('history.empty')} />
              </div>
            );
          const last = items[items.length - 1];
          const prev = items[items.length - 2];
          const best = items.reduce((a, b) => (b.net > a.net ? b : a));
          const nets = items.map((a) => a.net);
          const maxQ = Math.max(...items.map((a) => a.bySubject.reduce((s, b) => s + b.total, 0)));
          return (
            <>
              <section aria-label={t('history.summary')} className="grid gap-4 md:grid-cols-3">
                <StatTile variant="plain" tone="violet" icon={TrendingUp} label={t('history.lastNet')} value={n(last.net)} delta={prev ? { value: n(Math.abs(last.net - prev.net)), up: last.net >= prev.net, label: t('history.vsPrevious') } : undefined} />
                <StatTile variant="plain" tone="mint" icon={TrendingUp} label={t('history.bestNet')} value={n(best.net)} />
                <StatTile variant="plain" tone="peach" icon={History} label={t('history.attempts')} value={items.length} />
              </section>
              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <Panel title={t('history.trend')} description={t('history.trendHint', { exam: last.examType })}>
                  <LineChart
                    ariaLabel={t('history.trendAria')}
                    labels={items.map((_, i) => `${i + 1}`)}
                    tooltipLabels={items.map((a) => `${a.title} · ${formatDate(a.date, locale, { day: 'numeric', month: 'short' })}`)}
                    min={0}
                    max={Math.ceil(maxQ / 10) * 10}
                    formatValue={n}
                    series={[{ id: 'net', name: t('mocks.net'), color: 'rgb(var(--chart-emphasis))', values: nets, emphasis: true }]}
                  />
                </Panel>
                <Panel title={t('history.bySubject', { title: last.title })}>
                  <HBars ariaLabel={t('history.bySubject', { title: last.title })} data={last.bySubject.map((b) => ({ id: b.subject, label: b.subject, value: Math.max(0, b.net), display: `${n(b.net)} / ${b.total}` }))} max={Math.max(...last.bySubject.map((b) => b.total))} />
                </Panel>
              </div>
              <Panel className="mt-6" title={t('history.all')} bodyClassName="px-0 sm:px-0">
                <div className="relative overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-[14px]">
                    <caption className="sr-only">{t('history.all')}</caption>
                    <thead className="bg-surface-muted text-[13px] text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-6 py-3 font-semibold">{t('history.exam')}</th>
                        <th scope="col" className="px-3 py-3 font-semibold">{t('common.date', { ns: 'common' })}</th>
                        <th scope="col" className="px-3 py-3 text-right font-semibold">{t('quiz.correct', { ns: 'common' })}</th>
                        <th scope="col" className="px-3 py-3 text-right font-semibold">{t('quiz.wrong', { ns: 'common' })}</th>
                        <th scope="col" className="px-3 py-3 text-right font-semibold">{t('quiz.blank', { ns: 'common' })}</th>
                        <th scope="col" className="px-3 py-3 text-right font-semibold">{t('mocks.net')}</th>
                        <th scope="col" className="px-6 py-3 text-right font-semibold">{t('history.score')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...items].reverse().map((a) => (
                        <tr key={a.id} className="border-b border-border last:border-0">
                          <th scope="row" className="px-6 py-3 font-semibold text-foreground">{a.title}</th>
                          <td className="px-3 py-3 text-muted-foreground">{formatDate(a.date, locale)}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-success">{a.correct}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-danger">{a.wrong}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{a.blank}</td>
                          <td className="px-3 py-3 text-right font-semibold tabular-nums">{n(a.net)}</td>
                          <td className="px-6 py-3 text-right tabular-nums">{a.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="px-6 pt-3 text-[12.5px] text-muted-foreground">{t('history.scoreNote')}</p>
              </Panel>
            </>
          );
        }}
      </AsyncContent>
    </>
  );
}
