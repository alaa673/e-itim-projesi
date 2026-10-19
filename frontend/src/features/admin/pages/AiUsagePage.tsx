import { Bot, Coins, Download, Gauge, Info, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HBars } from '@/components/charts/HBars';
import { LineChart } from '@/components/charts/LineChart';
import { Meter } from '@/components/charts/Meter';
import { StatTile } from '@/components/dashboard/StatTile';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Panel } from '@/components/ui/Panel';
import { AsyncContent } from '@/components/ui/States';
import { IS_MOCK_MODE } from '@/config/constants';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { downloadCsv } from '@/utils/csv';
import { formatDate, formatNumber, formatPercent } from '@/utils/format';
import { aiReport } from '../services/adminApi';

export default function AiUsagePage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const { data, error, loading, reload } = useAsync((signal) => aiReport(signal), []);
  const money = (v: number) => formatNumber(v, locale, { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });

  return (
    <>
      <PageHeader
        title={t('aiUsage.title')}
        description={t('aiUsage.description')}
        actions={
          <>
            <Link to="/admin/settings/ai" className={buttonClass('secondary')}>
              <Settings2 className="h-4 w-4" aria-hidden />
              {t('aiUsage.settings')}
            </Link>
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" aria-hidden />}
              disabled={!data}
              onClick={() =>
                data &&
                downloadCsv('pusula-yapay-zeka-kullanimi', [
                  [t('common.date', { ns: 'common' }), t('aiUsage.operations'), t('aiUsage.cost')],
                  ...data.days.map((d) => [formatDate(d.date, locale), d.operations, d.cost]),
                ])
              }
            >
              {t('actions.exportCsv', { ns: 'common' })}
            </Button>
          </>
        }
      />
      {IS_MOCK_MODE && (
        <p className="mb-4 flex gap-2 rounded-[14px] border border-info/25 bg-info/[0.07] px-4 py-3 text-[13.5px] text-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
          {t('aiUsage.demoNote')}
        </p>
      )}
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(d) => {
          const ops = d.days.reduce((s, x) => s + x.operations, 0);
          const cost = d.days.reduce((s, x) => s + x.cost, 0);
          const pct = (cost / d.monthlyBudget) * 100;
          return (
            <>
              <section aria-label={t('aiUsage.summary')} className="grid gap-4 md:grid-cols-3">
                <StatTile variant="plain" tone="violet" icon={Bot} label={t('aiUsage.operations30')} value={formatNumber(ops, locale)} />
                <StatTile variant="plain" tone="peach" icon={Coins} label={t('aiUsage.cost30')} value={money(cost)} />
                <div className="panel px-5 py-4">
                  <p className="flex items-center gap-2 text-[14.5px] font-semibold text-foreground">
                    <Gauge className="h-5 w-5 text-accent-ink" aria-hidden />
                    {t('aiUsage.budget')}
                  </p>
                  <p className="mt-1 font-display text-[26px] font-extrabold text-foreground">
                    {formatPercent(pct, locale)} <span className="text-[14px] font-semibold text-muted-foreground">/ {money(d.monthlyBudget)}</span>
                  </p>
                  <Meter className="mt-2" size="lg" value={Math.min(100, pct)} tone={pct > 90 ? 'danger' : pct > 75 ? 'warning' : 'role'} label={t('aiUsage.budget')} />
                </div>
              </section>
              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <Panel title={t('aiUsage.daily')} description={t('aiUsage.dailyHint')}>
                  <LineChart
                    ariaLabel={t('aiUsage.dailyAria')}
                    labels={d.days.map((x) => formatDate(x.date, locale, { day: 'numeric', month: 'short' }))}
                    min={0}
                    max={Math.ceil(Math.max(...d.days.map((x) => x.operations)) / 10) * 10 + 10}
                    formatValue={(v) => formatNumber(v, locale)}
                    series={[{ id: 'ops', name: t('aiUsage.operations'), color: 'rgb(var(--chart-emphasis))', values: d.days.map((x) => x.operations), emphasis: true }]}
                  />
                </Panel>
                <Panel title={t('aiUsage.byFeature')}>
                  <HBars
                    ariaLabel={t('aiUsage.byFeature')}
                    data={d.features.map((f) => ({ id: f.key, label: t(`aiUsage.features.${f.key}`), value: f.cost, display: money(f.cost), detail: t('aiUsage.featureOps', { count: f.operations }) }))}
                  />
                </Panel>
              </div>
            </>
          );
        }}
      </AsyncContent>
    </>
  );
}
