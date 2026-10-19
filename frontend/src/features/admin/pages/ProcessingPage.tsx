import { ArrowRight, Cog, RotateCcw, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Meter } from '@/components/charts/Meter';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import type { Column } from '@/components/ui/DataTable';
import { useAction } from '@/hooks/useAction';
import { useInterval } from '@/hooks/useInterval';
import { useListQuery } from '@/hooks/useListQuery';
import { useLocale } from '@/hooks/useLocale';
import { useResourceList } from '@/hooks/useResourceList';
import type { ArchiveFile, ProcessingState } from '@/types';
import { formatFileSize } from '@/utils/format';
import { PipelineSteps, ProcessingBadge } from '../components/archive';
import { archiveFileApi } from '../services/adminApi';
import { API_BASE_URL } from '@/config/constants';
import { resolveFileUrl } from '@/utils/fileUrl';

export default function ProcessingPage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const lq = useListQuery<'status' | 'examType'>({ sort: { key: 'uploadedAt', direction: 'desc' }, descFirst: ['uploadedAt'] });
  const list = useResourceList(archiveFileApi.list, lq.query);
  const { run, busy } = useAction();
  const running = list.items.some((f) => f.status === 'running' || f.status === 'waiting');
  useInterval(list.refreshSilently, 2500, running);

  const counts = (['waiting', 'running', 'review', 'failed'] as ProcessingState[]).map((s) => ({ s, n: list.items.filter((f) => f.status === s).length }));

  const columns: Column<ArchiveFile>[] = [
    {
      id: 'file',
      header: t('common.file', { ns: 'common' }),
      rowHeader: true,
      cell: (f) => (
        <span className="flex min-w-[220px] items-center gap-3">
          <span className="icon-tile h-10 w-10 bg-danger/[0.1] text-[10.5px] font-black text-danger">PDF</span>
          <span className="min-w-0">
            {resolveFileUrl(f.fileUrl, API_BASE_URL) ? (
              <a href={resolveFileUrl(f.fileUrl, API_BASE_URL) ?? undefined} target="_blank" rel="noopener noreferrer" className="block truncate font-semibold text-accent-ink hover:underline">
                {f.fileName}
              </a>
            ) : (
              <span className="block truncate font-semibold text-foreground">{f.fileName}</span>
            )}
            <span className="block text-[12.5px] font-normal text-muted-foreground">
              {f.examType} {f.year} · {t(`pdf.kinds.${f.kind}`)} · {formatFileSize(f.sizeBytes, locale)} · {t('processing.pages', { count: f.pages })}
            </span>
          </span>
        </span>
      ),
    },
    { id: 'pipeline', header: t('archive.pipeline'), hideOnMobile: true, cell: (f) => <div className="w-[260px]"><PipelineSteps status={f.status} progress={f.progress} compact /></div> },
    {
      id: 'status',
      header: t('common.status', { ns: 'common' }),
      cell: (f) => (
        <span className="flex min-w-[160px] flex-col gap-1.5">
          <ProcessingBadge status={f.status} />
          {(f.status === 'running' || f.status === 'waiting') && <Meter size="sm" value={f.progress} label={`${f.fileName} ${t('archive.progress')}`} />}
          {f.status === 'failed' && f.error && <span className="max-w-[240px] text-[12.5px] text-danger">{f.error}</span>}
          {(f.status === 'review' || f.status === 'done') && f.questionCount !== null && <span className="text-[12.5px] text-muted-foreground">{t(f.kind === 'answerKey' ? 'processing.answers' : 'processing.questions', { count: f.questionCount })}</span>}
        </span>
      ),
    },
    { id: 'uploadedAt', header: t('processing.uploaded'), sortKey: 'uploadedAt', hideOnMobile: true, cell: (f) => <span className="text-muted-foreground"><RelativeTime iso={f.uploadedAt} /><span className="block text-[12px]">{f.uploadedBy}</span></span> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (f) =>
        f.status === 'failed' ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            icon={<RotateCcw className="h-4 w-4" aria-hidden />}
            aria-label={`${t('actions.retry', { ns: 'common' })}: ${f.fileName}`}
            onClick={async () => {
              const saved = await run(() => archiveFileApi.retry(f.id), { success: t('processing.retried', { name: f.fileName }) });
              if (saved) list.refresh();
            }}
          >
            {t('actions.retry', { ns: 'common' })}
          </Button>
        ) : f.status === 'review' ? (
          <Link to={`/admin/exam-archive/review?file=${f.id}`} className={buttonClass('soft', 'sm')} aria-label={`${t('pdf.reviewQuestions')}: ${f.fileName}`}>
            {t('pdf.reviewQuestions')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title={t('processing.title')}
        description={t('processing.description')}
        actions={
          <Link to="/admin/exam-archive/upload" className={buttonClass('primary')}>
            <UploadCloud className="h-4 w-4" aria-hidden />
            {t('pdf.title')}
          </Link>
        }
      />
      <section aria-label={t('processing.summary')} className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {counts.map(({ s, n }) => (
          <button
            key={s}
            type="button"
            onClick={() => lq.setFilter('status', lq.filters.status === s ? '' : s)}
            aria-pressed={lq.filters.status === s}
            className="panel card-interactive flex items-center justify-between px-4 py-3 text-left aria-pressed:ring-2 aria-pressed:ring-primary"
          >
            <ProcessingBadge status={s} />
            <span className="font-display text-[24px] font-extrabold tabular-nums text-foreground">{n}</span>
          </button>
        ))}
      </section>
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('processing.searchPlaceholder')}
        filters={[
          { key: 'status', label: t('common.status', { ns: 'common' }), value: lq.filters.status ?? '', allLabel: t('common.allStatuses', { ns: 'common' }), options: (['waiting', 'running', 'review', 'done', 'failed'] as const).map((v) => ({ value: v, label: t(`archive.state.${v}`) })) },
          { key: 'examType', label: t('common.examType', { ns: 'common' }), value: lq.filters.examType ?? '', allLabel: t('common.allTypes', { ns: 'common' }), options: ['LGS', 'TYT', 'AYT'].map((v) => ({ value: v, label: v })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'status' | 'examType', v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('processing.title')}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        empty={{ icon: <Cog className="h-5 w-5" aria-hidden />, title: t('processing.empty') }}
      />
      <p className="mt-3 text-[13px] text-muted-foreground">{t('processing.note')}</p>
    </>
  );
}
