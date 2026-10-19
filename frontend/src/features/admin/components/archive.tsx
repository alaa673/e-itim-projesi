import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Clock3, FileSearch, Loader2, ScanLine, SplitSquareVertical, Tags } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import type { ProcessingState } from '@/types';

const TONE: Record<ProcessingState, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  waiting: 'neutral',
  running: 'info',
  review: 'warning',
  done: 'success',
  failed: 'danger',
};
const ICON = { waiting: Clock3, running: Loader2, review: FileSearch, done: CheckCircle2, failed: AlertTriangle };

export function ProcessingBadge({ status }: { status: ProcessingState }) {
  const { t } = useTranslation('admin');
  const Icon = ICON[status];
  return (
    <Badge tone={TONE[status]} icon={<Icon className={clsx('h-3.5 w-3.5', status === 'running' && 'motion-safe:animate-spin')} aria-hidden />}>
      {t(`archive.state.${status}`)}
    </Badge>
  );
}

/** Scan → split → classify → approve, highlighting how far a file has got. */
export function PipelineSteps({ status, progress, compact }: { status?: ProcessingState; progress?: number; compact?: boolean }) {
  const { t } = useTranslation('admin');
  const steps = [
    { key: 'scan', icon: ScanLine },
    { key: 'split', icon: SplitSquareVertical },
    { key: 'classify', icon: Tags },
    { key: 'approve', icon: CheckCircle2 },
  ] as const;
  const reached =
    status === undefined ? -1 : status === 'done' ? 4 : status === 'review' ? 3 : status === 'running' ? Math.min(2, Math.floor((progress ?? 0) / 34)) : status === 'failed' ? Math.min(2, Math.floor((progress ?? 0) / 34)) : -1;
  return (
    <ol className={clsx('flex items-start', compact ? 'gap-1' : 'gap-2')} aria-label={t('archive.pipeline')}>
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = i < reached || reached === 4;
        const current = i === reached && reached < 4;
        return (
          <li key={s.key} className="flex flex-1 flex-col items-center text-center" aria-current={current ? 'step' : undefined}>
            <span
              className={clsx(
                'flex items-center justify-center rounded-full border-2 transition-colors',
                compact ? 'h-9 w-9' : 'h-14 w-14',
                done ? 'border-success bg-success/[0.1] text-success' : current ? (status === 'failed' ? 'border-danger bg-danger/[0.08] text-danger' : 'border-primary bg-accent-soft text-accent-ink') : 'border-border bg-surface text-muted-foreground',
              )}
            >
              <Icon className={compact ? 'h-4 w-4' : 'h-6 w-6'} aria-hidden />
            </span>
            <span className={clsx('mt-1.5 font-semibold text-foreground', compact ? 'text-[11.5px]' : 'text-[13.5px]')}>{t(`archive.steps.${s.key}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}
