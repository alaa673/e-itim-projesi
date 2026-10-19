import { Activity, ClipboardCheck, Download, FileUp, GraduationCap, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HBars } from '@/components/charts/HBars';
import { LineChart } from '@/components/charts/LineChart';
import { Meter } from '@/components/charts/Meter';
import { StatTile } from '@/components/dashboard/StatTile';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { AsyncContent } from '@/components/ui/States';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { downloadCsv } from '@/utils/csv';
import { formatDate, formatNumber, formatPercent } from '@/utils/format';
import { usageReport } from '../services/adminApi';

type Range = '4' | '8' | '12';

export default function PlatformUsagePage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const { data, error, loading, reload } = useAsync((signal) => usageReport(signal), []);
  const [range, setRange] = useState<Range>('12');

  return (
    <>
      <PageHeader
        title={t('usage.title')}
        description={t('usage.description')}
        actions={
          <Button
            variant="secondary"
            icon={<Download className="h-4 w-4" aria-hidden />}
            disabled={!data}
            onClick={() =>
              data &&
              downloadCsv('pusula-platform-kullanimi', [
                [t('common.week', { ns: 'common' }), t('usage.activeStudents'), t('usage.activeTeachers'), t('usage.examsTaken'), t('usage.filesUploaded')],
                ...data.weeks.map((w) => [formatDate(w.week, locale), w.activeStudents, w.activeTeachers, w.examsTaken, w.filesUploaded]),
              ])
            }
          >
            {t('actions.exportCsv', { ns: 'common' })}
          </Button>
        }
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(d) => {
          const weeks = d.weeks.slice(-Number(range));
          const last = weeks[weeks.length - 1];
          const prev = weeks[weeks.length - 2] ?? last;
          const delta = (a: number, b: number) => ({ value: formatPercent(Math.abs(((a - b) / Math.max(1, b)) * 100), locale), up: a >= b, label: t('usage.vsLastWeek') });
          return (
            <>
              <section aria-label={t('usage.summary')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile variant="plain" tone="violet" icon={GraduationCap} label={t('usage.activeStudents')} value={formatNumber(last.activeStudents, locale)} delta={delta(last.activeStudents, prev.activeStudents)} />
                <StatTile variant="plain" tone="mint" icon={UsersRound} label={t('usage.activeTeachers')} value={formatNumber(last.activeTeachers, locale)} delta={delta(last.activeTeachers, prev.activeTeachers)} />
                <StatTile variant="plain" tone="peach" icon={ClipboardCheck} label={t('usage.examsTaken')} value={formatNumber(last.examsTaken, locale)} delta={delta(last.examsTaken, prev.examsTaken)} />
                <StatTile variant="plain" tone="sky" icon={FileUp} label={t('usage.filesUploaded')} value={formatNumber(last.filesUploaded, locale)} delta={delta(last.filesUploaded, prev.filesUploaded)} />
              </section>

              <Panel
                className="mt-6"
                icon={Activity}
                title={t('usage.trend')}
                description={t('usage.trendHint')}
                action={
                  <SegmentedControl
                    size="sm"
                    label={t('usage.range')}
                    hideLabel
                    value={range}
                    onChange={setRange}
                    options={[
                      { value: '4', label: t('usage.weeks', { count: 4 }) },
                      { value: '8', label: t('usage.weeks', { count: 8 }) },
                      { value: '12', label: t('usage.weeks', { count: 12 }) },
                    ]}
                  />
                }
              >
                <LineChart
                  ariaLabel={t('usage.trendAria')}
                  labels={weeks.map((w) => formatDate(w.week, locale, { day: 'numeric', month: 'short' }))}
                  min={0}
                  max={Math.ceil(Math.max(...weeks.map((w) => Math.max(w.activeStudents, w.examsTaken))) / 100) * 100}
                  formatValue={(v) => formatNumber(v, locale)}
                  series={[
                    { id: 's', name: t('usage.activeStudents'), color: 'rgb(var(--chart-emphasis))', values: weeks.map((w) => w.activeStudents), emphasis: true },
                    { id: 'e', name: t('usage.examsTaken'), color: 'rgb(var(--chart-3))', values: weeks.map((w) => w.examsTaken) },
                  ]}
                />
              </Panel>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Panel icon={UsersRound} title={t('usage.byRole')}>
                  <ul className="space-y-4">
                    {d.byRole.map((r) => {
                      const pct = (r.active / Math.max(1, r.total)) * 100;
                      return (
                        <li key={r.role}>
                          <div className="mb-1.5 flex justify-between text-[14px]">
                            <span className="font-semibold text-foreground">{t(`roles.${r.role}`, { ns: 'common' })}</span>
                            <span className="tabular-nums text-muted-foreground">
                              {formatNumber(r.active, locale)} / {formatNumber(r.total, locale)} · {formatPercent(pct, locale)}
                            </span>
                          </div>
                          <Meter value={pct} tone="role" size="lg" label={`${t(`roles.${r.role}`, { ns: 'common' })} ${t('usage.activeShare')}`} />
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-4 text-[12.5px] text-muted-foreground">{t('usage.activeDefinition')}</p>
                </Panel>
                <Panel icon={Activity} title={t('usage.topPages')}>
                  <HBars
                    ariaLabel={t('usage.topPages')}
                    data={d.topPages.map((p) => {
                      const [role, id] = p.page.split('.');
                      return { id: p.page, label: `${t(`nav.${role}.${id}`, { ns: 'common' })} · ${t(`roles.${role}`, { ns: 'common' })}`, value: p.views, display: formatNumber(p.views, locale) };
                    })}
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
