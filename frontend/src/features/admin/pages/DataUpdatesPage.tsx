import { Briefcase, Database, GraduationCap, Loader2, School, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/providers/authContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FileDrop } from '@/components/ui/FileDrop';
import { Modal } from '@/components/ui/Modal';
import { Panel } from '@/components/ui/Panel';
import { AsyncContent } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useInterval } from '@/hooks/useInterval';
import { useLocale } from '@/hooks/useLocale';
import type { DataSource } from '@/types';
import { parseCsv } from '@/utils/csv';
import { formatDate, formatNumber } from '@/utils/format';
import { dataSourceApi } from '../services/adminApi';

const DATASETS = [
  { key: 'schools', icon: School, tone: 'bg-tint-violet text-ink-violet' },
  { key: 'universities', icon: GraduationCap, tone: 'bg-tint-mint text-ink-mint' },
  { key: 'careers', icon: Briefcase, tone: 'bg-tint-sky text-ink-sky' },
] as const;
const STATUS_TONE = { current: 'success', outdated: 'warning', importing: 'info' } as const;

export default function DataUpdatesPage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync((signal) => dataSourceApi.list({ offset: 0, limit: 100, sortKey: 'updatedAt', sortDirection: 'desc' }, signal), []);
  const [importing, setImporting] = useState<DataSource['dataset'] | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const { run, busy } = useAction();
  useInterval(reload, 2000, data?.items.some((s) => s.status === 'importing') ?? false);

  const submit = async () => {
    if (!importing || !files[0]) {
      setFileError(t('dataUpdates.chooseFile'));
      return;
    }
    const rows = parseCsv(await files[0].text()).length - 1;
    if (rows < 1) {
      setFileError(t('import.errors.empty'));
      return;
    }
    const ok = await run(() => dataSourceApi.importFile(importing, files[0], user ? `${user.firstName} ${user.lastName}` : '', rows), {
      success: t('dataUpdates.started', { count: rows }),
    });
    if (ok) {
      setImporting(null);
      setFiles([]);
      reload();
    }
  };

  return (
    <>
      <PageHeader title={t('dataUpdates.title')} description={t('dataUpdates.description')} />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(page) => (
          <>
            <section aria-label={t('dataUpdates.datasets')} className="grid gap-4 md:grid-cols-3">
              {DATASETS.map(({ key, icon: Icon, tone }) => {
                const current = page.items.find((s) => s.dataset === key && s.status !== 'outdated');
                return (
                  <article key={key} className="panel flex flex-col p-5">
                    <div className="flex items-center gap-3">
                      <span className={`icon-tile h-12 w-12 ${tone}`}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-[17px] font-extrabold text-foreground">{t(`dataUpdates.dataset.${key}`)}</h2>
                        <p className="text-[13px] text-muted-foreground">{current ? t('common.records', { ns: 'common', count: current.records }) : t('dataUpdates.noData')}</p>
                      </div>
                      {current && (
                        <Badge tone={STATUS_TONE[current.status]} icon={current.status === 'importing' ? <Loader2 className="h-3 w-3 motion-safe:animate-spin" aria-hidden /> : undefined} dot={current.status !== 'importing'}>
                          {t(`dataUpdates.status.${current.status}`)}
                        </Badge>
                      )}
                    </div>
                    {current && (
                      <p className="mt-3 text-[13px] text-muted-foreground">
                        {t('dataUpdates.lastUpdate')}: <RelativeTime iso={current.updatedAt} /> · {current.source} ({current.year})
                      </p>
                    )}
                    <Button className="mt-4 self-start" variant="soft" size="sm" icon={<UploadCloud className="h-4 w-4" aria-hidden />} onClick={() => setImporting(key)}>
                      {t('dataUpdates.upload')}
                    </Button>
                  </article>
                );
              })}
            </section>

            <Panel className="mt-6" icon={Database} title={t('dataUpdates.history')} bodyClassName="px-0 sm:px-0">
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-[14px]">
                  <caption className="sr-only">{t('dataUpdates.history')}</caption>
                  <thead className="bg-surface-muted text-[13px] text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-6 py-3 font-semibold">{t('dataUpdates.datasetLabel')}</th>
                      <th scope="col" className="px-3 py-3 font-semibold">{t('common.source', { ns: 'common' })}</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">{t('dataUpdates.records')}</th>
                      <th scope="col" className="px-3 py-3 font-semibold">{t('common.lastUpdated', { ns: 'common' })}</th>
                      <th scope="col" className="px-6 py-3 font-semibold">{t('common.status', { ns: 'common' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <th scope="row" className="px-6 py-3 font-semibold text-foreground">{t(`dataUpdates.dataset.${s.dataset}`)} · {s.year}</th>
                        <td className="px-3 py-3 text-foreground">{s.source}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{formatNumber(s.records, locale)}</td>
                        <td className="px-3 py-3 text-muted-foreground">{formatDate(s.updatedAt, locale)} · {s.updatedBy}</td>
                        <td className="px-6 py-3">
                          <Badge tone={STATUS_TONE[s.status]} dot>
                            {t(`dataUpdates.status.${s.status}`)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </>
        )}
      </AsyncContent>

      <Modal
        open={importing !== null}
        onClose={() => setImporting(null)}
        preventClose={busy}
        title={importing ? t('dataUpdates.uploadTitle', { dataset: t(`dataUpdates.dataset.${importing}`) }) : ''}
        description={t('dataUpdates.uploadHint')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setImporting(null)} disabled={busy}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button loading={busy} onClick={() => void submit()} icon={<UploadCloud className="h-4 w-4" aria-hidden />}>
              {t('actions.import', { ns: 'common' })}
            </Button>
          </>
        }
      >
        <FileDrop
          label={t('common.file', { ns: 'common' })}
          accept=".csv"
          maxSize={10 * 1024 * 1024}
          files={files}
          onChange={(f) => {
            setFiles(f);
            setFileError(null);
          }}
          error={fileError ?? undefined}
          hint={t('dataUpdates.fileHint')}
        />
        <p className="mt-3 text-[13px] text-muted-foreground">{t('dataUpdates.serverNote')}</p>
      </Modal>
    </>
  );
}
