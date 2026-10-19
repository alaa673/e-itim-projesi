import clsx from 'clsx';

export interface HBarDatum {
  id: string;
  label: string;
  value: number;
  /** Text shown at the end of the bar (defaults to the value). */
  display?: string;
  detail?: string;
}

/** Horizontal bar list (semantic list + progress meters); the value is always printed next to the bar. */
export function HBars({ data, max, ariaLabel, colorClass = 'bg-primary' }: { data: HBarDatum[]; max?: number; ariaLabel: string; colorClass?: string }) {
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3" aria-label={ariaLabel}>
      {data.map((d) => (
        <li key={d.id}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13.5px]">
            <span className="font-semibold text-foreground">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">{d.display ?? d.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-foreground/[0.07]" role="presentation">
            <div className={clsx('h-full rounded-full transition-[width] duration-700', colorClass)} style={{ width: `${Math.max(2, (d.value / top) * 100)}%` }} />
          </div>
          {d.detail && <p className="mt-1 text-[12px] text-muted-foreground">{d.detail}</p>}
        </li>
      ))}
    </ul>
  );
}
