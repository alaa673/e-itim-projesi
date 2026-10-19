import { Archive, DatabaseBackup, HardDrive, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { AsyncContent } from '@/components/ui/States';
import { IS_MOCK_MODE } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { useLocale } from '@/hooks/useLocale';
import { formatDate, formatNumber, formatTime } from '@/utils/format';
import { SaveBar } from '../components/SaveBar';
import { useSettings } from '../hooks/useSettings';
import { type RetentionSettings, settingsApi } from '../services/adminApi';

type YearKey = 'examResultsYears' | 'submissionsYears' | 'archivedAccountsYears';
type MonthKey = 'messagesMonths' | 'auditLogMonths';

export default function RetentionPage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const s = useSettings('retention');
  const { run, busy } = useAction();

  return (
    <>
      <PageHeader title={t('retention.title')} description={t('retention.description')} />
      <AsyncContent data={s.draft} error={s.error} loading={s.loading} reload={s.reload}>
        {(d) => {
          const set = (patch: Partial<RetentionSettings>) => s.setDraft({ ...d, ...patch });
          const yearRow = (key: YearKey, options: number[]) => (
            <Select key={key} label={t(`retention.fields.${key}`)} value={String(d[key])} onChange={(e) => set({ [key]: Number(e.target.value) })} options={options.map((v) => ({ value: String(v), label: t('retention.years', { count: v }) }))} />
          );
          const monthRow = (key: MonthKey, options: number[]) => (
            <Select key={key} label={t(`retention.fields.${key}`)} value={String(d[key])} onChange={(e) => set({ [key]: Number(e.target.value) })} options={options.map((v) => ({ value: String(v), label: t('retention.months', { count: v }) }))} />
          );
          return (
            <>
              <div className="grid gap-6 xl:grid-cols-2">
                <Panel icon={Archive} title={t('retention.periods')} description={t('retention.periodsHint')}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {yearRow('examResultsYears', [1, 2, 3, 5, 10])}
                    {yearRow('submissionsYears', [1, 2, 3, 5])}
                    {monthRow('messagesMonths', [3, 6, 12, 24])}
                    {monthRow('auditLogMonths', [6, 12, 24, 36])}
                    {yearRow('archivedAccountsYears', [1, 2, 3, 5])}
                  </div>
                  <p className="mt-4 flex gap-2 text-[12.5px] text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    {t('retention.kvkk')}
                  </p>
                </Panel>
                <Panel
                  icon={DatabaseBackup}
                  title={t('retention.backups')}
                  action={
                    <Button
                      size="sm"
                      variant="soft"
                      loading={busy}
                      icon={<HardDrive className="h-4 w-4" aria-hidden />}
                      onClick={async () => {
                        const res = await run(() => settingsApi.createBackup(), { success: t('retention.backupDone'), description: IS_MOCK_MODE ? t('retention.backupDemo') : undefined });
                        if (res) s.applyServer({ backups: res.backups });
                      }}
                    >
                      {t('retention.backupNow')}
                    </Button>
                  }
                >
                  <SegmentedControl
                    label={t('retention.frequency')}
                    value={d.backupFrequency}
                    onChange={(v) => set({ backupFrequency: v })}
                    options={[
                      { value: 'daily', label: t('retention.daily') },
                      { value: 'weekly', label: t('retention.weekly') },
                    ]}
                  />
                  <ul className="mt-4 divide-y divide-border rounded-[16px] border border-border">
                    {d.backups.map((b) => (
                      <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold text-foreground">
                            {formatDate(b.at, locale, { day: 'numeric', month: 'long' })} {formatTime(b.at, locale)}
                          </span>
                          <span className="block text-[12.5px] text-muted-foreground">
                            {t(`retention.kind.${b.kind}`)}
                            {b.status === 'success' && ` · ${formatNumber(b.sizeMb, locale)} MB`}
                          </span>
                        </span>
                        <Badge tone={b.status === 'success' ? 'success' : 'danger'} dot>
                          {t(`retention.status.${b.status}`)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[12.5px] text-muted-foreground">{t('retention.restoreNote')}</p>
                </Panel>
              </div>
              <SaveBar dirty={s.dirty} saving={s.saving} onReset={s.reset} onSave={() => void s.save()} />
            </>
          );
        }}
      </AsyncContent>
    </>
  );
}
