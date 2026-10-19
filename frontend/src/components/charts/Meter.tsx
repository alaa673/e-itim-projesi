import clsx from 'clsx';
import { scoreTone } from './scoreTone';

export type MeterTone = 'role' | 'accent' | 'success' | 'warning' | 'danger' | 'achievement' | 'lime' | 'score';

const FILL: Record<Exclude<MeterTone, 'score'>, string> = {
  role: 'bg-primary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-chart-4',
  danger: 'bg-danger',
  achievement: 'bg-achievement',
  lime: 'bg-lime',
};

/**
 * Progress meter.
 * `score` picks red / amber / green from the value; `track` lets a meter sit on a coloured card.
 */
export function Meter({
  value,
  max = 100,
  label,
  tone = 'role',
  size = 'md',
  track,
  fill,
  className,
}: {
  value: number;
  max?: number;
  label: string;
  tone?: MeterTone;
  size?: 'sm' | 'md' | 'lg';
  /** Override the track colour class (e.g. 'bg-white/25' on a saturated card). */
  track?: string;
  /** Override the fill colour class (illustrated cards with fixed colours). */
  fill?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const resolved = tone === 'score' ? scoreTone(pct) : tone;
  const height = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' }[size];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={clsx('w-full overflow-hidden rounded-full', height, track ?? 'bg-foreground/[0.08]', className)}
    >
      <div className={clsx('h-full rounded-full transition-[width] duration-700', fill ?? FILL[resolved])} style={{ width: `${pct}%` }} />
    </div>
  );
}
