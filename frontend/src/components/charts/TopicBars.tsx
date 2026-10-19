import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { formatPercent } from '@/utils/format';

export interface TopicBarDatum {
  id: string;
  label: string;
  percent: number;
  /** Optional secondary line under the label (e.g. "12 students below 50%"). */
  detail?: string;
  /** Optional previous value, drawn as a thin tick for comparison. */
  previous?: number | null;
  action?: ReactNode;
}

interface TopicBarsProps {
  data: TopicBarDatum[];
  threshold: number;
  thresholdLabel: string;
  reviewLabel: string;
  previousLabel?: string;
}

/**
 * Horizontal bars, one series (topic score %). Single hue; topics under the threshold are
 * flagged with an icon + text, not colour alone. Threshold drawn as a hairline.
 */
export function TopicBars({ data, threshold, thresholdLabel, reviewLabel, previousLabel }: TopicBarsProps) {
  const locale = useLocale();
  const hasActions = data.some((d) => d.action);
  return (
    <div>
      <ul className="space-y-3.5">
        {data.map((item) => {
          const weak = item.percent < threshold;
          const tooltip = [
            `${item.label}: ${formatPercent(item.percent, locale)}`,
            item.previous != null && previousLabel ? `${previousLabel}: ${formatPercent(item.previous, locale)}` : null,
            item.detail,
          ]
            .filter(Boolean)
            .join(' · ');
          return (
            <li
              key={item.id}
              className={clsx(
                'group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5',
                hasActions ? 'sm:grid-cols-[minmax(140px,220px)_minmax(0,1fr)_300px]' : 'sm:grid-cols-[minmax(130px,200px)_minmax(0,1fr)_178px]',
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                {item.detail && <p className="truncate text-[12.5px] text-muted-foreground">{item.detail}</p>}
              </div>
              <div className="order-3 col-span-2 sm:order-none sm:col-span-1" title={tooltip}>
                <div className="relative h-3 w-full rounded-full bg-primary/[0.09]" role="img" aria-label={tooltip}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-r-[4px] rounded-l-full transition-[width] duration-500 group-hover:brightness-110"
                    style={{ width: `${Math.max(item.percent, 2)}%`, background: 'linear-gradient(90deg, rgb(var(--chart-emphasis) / 0.7), rgb(var(--chart-emphasis)))' }}
                  />
                  {item.previous != null && (
                    <span
                      aria-hidden
                      className="absolute -top-1 h-5 w-[2px] rounded bg-foreground/55"
                      style={{ left: `calc(${item.previous}% - 1px)` }}
                    />
                  )}
                  <span aria-hidden className="absolute -top-1.5 h-6 w-px bg-foreground/30" style={{ left: `${threshold}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">{formatPercent(item.percent, locale)}</span>
                <span className="flex shrink-0 justify-start sm:w-[118px]">
                  {weak && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-1 text-[12px] font-semibold text-danger sm:py-0.5">
                      <AlertTriangle className="h-3 w-3" aria-hidden />
                      <span className="sr-only sm:not-sr-only">{reviewLabel}</span>
                    </span>
                  )}
                </span>
                {hasActions && <span className="flex shrink-0 justify-end sm:w-[118px]">{item.action}</span>}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-3.5 w-px bg-foreground/40" /> {thresholdLabel}
        </span>
        {previousLabel && data.some((d) => d.previous != null) && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-3.5 w-[2px] rounded bg-foreground/60" /> {previousLabel}
          </span>
        )}
      </p>
    </div>
  );
}
