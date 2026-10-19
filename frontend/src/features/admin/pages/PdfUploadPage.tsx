import { ArrowRight, FileText, Info, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import { Meter } from '@/components/charts/Meter';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { FileDrop } from '@/components/ui/FileDrop';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { AsyncContent, Skeleton } from '@/components/ui/States';
import { IS_MOCK_MODE } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useInterval } from '@/hooks/useInterval';
import { useLocale } from '@/hooks/useLocale';
import type { ArchiveFile, ExamType } from '@/types';
import { formatFileSize } from '@/utils/format';
import { PipelineSteps, ProcessingBadge } from '../components/archive';
import { archiveFileApi } from '../services/adminApi';

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021];

export default function PdfUploadPage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const { user } = useAuth();
  const [examType, setExamType] = useState<ExamType>('LGS');
  const [year, setYear] = useState('2025');
  const [kind, setKind] = useState<ArchiveFile['kind']>('questions');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const recent = useAsync((signal) => archiveFileApi.list({ offset: 0, limit: 6, sortKey: 'uploadedAt', sortDirection: 'desc' }, signal), []);
  const { run, busy } = useAction();
  const active = recent.data?.items.some((f) => f.status === 'running' || f.status === 'waiting') ?? false;
  useInterval(recent.reload, 2000, active);

  const submit = async () => {
    if (!files[0]) {
      setFileError(t('pdf.chooseFile'));
      return;
    }
    const saved = await run(() => archiveFileApi.upload({ examType, year: Number(year), kind, file: files[0] }, user ? `${user.firstName} ${user.lastName}` : ''), {
      success: t('pdf.uploaded', { name: files[0].name }),
      description: IS_MOCK_MODE ? t('pdf.demoNote') : undefined,
    });
    if (saved) {
      setFiles([]);
      recent.reload();
    }
  };

  return (
    <>
      <PageHeader title={t('pdf.title')} description={t('pdf.description')} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel icon={UploadCloud} title={t('pdf.formTitle')} className="bg-[linear-gradient(160deg,rgb(var(--accent-soft)),rgb(var(--surface))_45%)]">
          <div className="space-y-4">
            <SegmentedControl
              label={t('common.examType', { ns: 'common' })}
              value={examType}
              onChange={setExamType}
              options={(['LGS', 'TYT', 'AYT'] as const).map((v) => ({ value: v, label: v }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label={t('common.year', { ns: 'common' })} value={year} onChange={(e) => setYear(e.target.value)} options={YEARS.map((y) => ({ value: String(y), label: String(y) }))} />
              <Select
                label={t('pdf.kind')}
                value={kind}
                onChange={(e) => setKind(e.target.value as ArchiveFile['kind'])}
                options={[
                  { value: 'questions', label: t('pdf.kinds.questions') },
                  { value: 'answerKey', label: t('pdf.kinds.answerKey') },
                ]}
              />
            </div>
            <FileDrop
              label={t('pdf.file')}
              accept=".pdf,application/pdf"
              hint={t('pdf.fileHint')}
              files={files}
              onChange={(next) => {
                setFiles(next);
                setFileError(null);
              }}
              error={fileError ?? undefined}
            />
            <div className="rounded-[14px] bg-surface-muted p-4">
              <PipelineSteps />
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{t('pdf.pipelineHint')}</p>
            </div>
            {IS_MOCK_MODE && (
              <p className="flex gap-2 rounded-[12px] bg-info/[0.08] p-3 text-[13px] text-info">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {t('pdf.demoNote')}
              </p>
            )}
            <Button variant="ink" size="lg" className="w-full" loading={busy} icon={<UploadCloud className="h-5 w-5" aria-hidden />} onClick={() => void submit()}>
              {t('pdf.submit')}
            </Button>
          </div>
        </Panel>

        <Panel
          icon={FileText}
          title={t('pdf.recent')}
          action={
            <Link to="/admin/exam-archive/processing" className="link-accent">
              {t('pdf.allJobs')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        >
          <AsyncContent data={recent.data} error={recent.error} loading={recent.loading} reload={recent.reload} skeleton={<Skeleton className="h-64 rounded-[16px]" />}>
            {(page) =>
              page.items.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">{t('pdf.noFiles')}</p>
              ) : (
                <ul className="space-y-3">
                  {page.items.map((f) => (
                    <li key={f.id} className="rounded-[16px] border border-border p-4">
                      <div className="flex items-start gap-3">
                        <span className="icon-tile h-11 w-11 bg-danger/[0.1] text-[11px] font-black text-danger">PDF</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground">{f.fileName}</p>
                          <p className="text-[12.5px] text-muted-foreground">
                            {f.examType} {f.year} · {t(`pdf.kinds.${f.kind}`)} · {formatFileSize(f.sizeBytes, locale)} · <RelativeTime iso={f.uploadedAt} />
                          </p>
                        </div>
                        <ProcessingBadge status={f.status} />
                      </div>
                      {(f.status === 'running' || f.status === 'waiting') && (
                        <div className="mt-3 flex items-center gap-3">
                          <Meter value={f.progress} label={`${f.fileName} ${t('archive.progress')}`} />
                          <span className="w-10 text-right text-[12.5px] tabular-nums text-muted-foreground">{t('common.percentValue', { ns: 'common', value: f.progress })}</span>
                        </div>
                      )}
                      {f.status === 'review' && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-warning/[0.08] px-3 py-2">
                          <span className="text-[13px] text-foreground">{t('pdf.reviewReady', { count: f.questionCount ?? 0 })}</span>
                          <Link to={`/admin/exam-archive/review?file=${f.id}`} className={buttonClass('secondary', 'sm')}>
                            {t('pdf.reviewQuestions')}
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </Link>
                        </div>
                      )}
                      {f.status === 'failed' && f.error && <p className="mt-2 text-[13px] text-danger">{f.error}</p>}
                    </li>
                  ))}
                </ul>
              )
            }
          </AsyncContent>
        </Panel>
      </div>
    </>
  );
}
