import { useEffect, useId, useMemo, useRef, useState } from 'react';

export interface LineSeries {
  id: string;
  name: string;
  /** CSS colour from a token, e.g. rgb(var(--chart-emphasis)). */
  color: string;
  values: number[];
  emphasis?: boolean;
}

interface LineChartProps {
  labels: string[];
  /** Long labels for the tooltip (e.g. full exam name + date). */
  tooltipLabels?: string[];
  series: LineSeries[];
  min?: number;
  max?: number;
  height?: number;
  ariaLabel: string;
  formatValue: (value: number) => string;
}

const PAD = { top: 16, right: 44, bottom: 30, left: 34 };

/**
 * Small responsive SVG line chart: 2px lines, 8px end markers with a surface ring,
 * hairline grid, crosshair + tooltip on hover/focus, legend above (≥2 series).
 */
export function LineChart({ labels, tooltipLabels, series, min = 0, max = 100, height = 240, ariaLabel, formatValue }: LineChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [active, setActive] = useState<number | null>(null);
  const areaId = useId();

  useEffect(() => {
    const node = wrapRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const innerW = width - PAD.left - PAD.right;
  const labelStep = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor(innerW / 64))));
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (labels.length <= 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH;
  const ticks = useMemo(() => {
    // "Nice" step (1, 2, 2.5 or 5 × 10^k) giving about four grid lines.
    const raw = (max - min) / 4;
    const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-9)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((c) => c >= raw) ?? 10 * pow;
    const list: number[] = [];
    for (let v = Math.ceil(min / step) * step; v <= max; v += step) list.push(v);
    return list;
  }, [min, max]);

  const handleMove = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rel = clientX - rect.left - PAD.left;
    const index = Math.round((rel / innerW) * (labels.length - 1));
    setActive(Math.min(labels.length - 1, Math.max(0, index)));
  };

  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
          {series.map((s) => (
            <li key={s.id} className="inline-flex items-center gap-2">
              {s.emphasis ? (
                <span aria-hidden className="h-[3px] w-5 rounded-full" style={{ background: s.color }} />
              ) : (
                <span aria-hidden className="w-5 border-t-2 border-dashed" style={{ borderColor: s.color }} />
              )}
              {s.name}
            </li>
          ))}
        </ul>
      )}
      <div
        ref={wrapRef}
        className="relative w-full"
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setActive(null)}
        onTouchStart={(e) => handleMove(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      >
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block max-w-full overflow-visible">
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} stroke="rgb(var(--chart-grid))" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                {tick}
              </text>
            </g>
          ))}
          {labels.map((label, i) =>
            // Thin out crowded axes (about one label per 64px); the tooltip still shows every point.
            i % labelStep === 0 || (i === labels.length - 1 && i % labelStep >= labelStep / 2) ? (
              <text key={label + i} x={x(i)} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                {label}
              </text>
            ) : null,
          )}
          {active !== null && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + innerH} stroke="rgb(var(--chart-axis))" strokeWidth={1} />}
          {series.map((s) => {
            const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
            const lastIndex = s.values.length - 1;
            return (
              <g key={s.id}>
                {s.emphasis && (
                  <>
                    <defs>
                      <linearGradient id={`${areaId}-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={s.color} stopOpacity={0.24} />
                        <stop offset="1" stopColor={s.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <path
                      d={`${d} L${x(lastIndex).toFixed(1)},${PAD.top + innerH} L${x(0).toFixed(1)},${PAD.top + innerH} Z`}
                      fill={`url(#${areaId}-${s.id})`}
                      aria-hidden
                    />
                  </>
                )}
                <path d={d} fill="none" stroke={s.color} strokeWidth={s.emphasis ? 3 : 2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.emphasis ? undefined : '5 5'} opacity={s.emphasis ? 1 : 0.9} />
                {s.values.map((v, i) =>
                  i === lastIndex || i === active ? (
                    <circle key={i} cx={x(i)} cy={y(v)} r={4.5} fill={s.color} stroke="rgb(var(--surface))" strokeWidth={2} />
                  ) : null,
                )}
                {s.emphasis && (
                  <text x={x(lastIndex) + 9} y={y(s.values[lastIndex])} dy="0.32em" className="fill-foreground text-[12px] font-semibold tabular-nums">
                    {formatValue(s.values[lastIndex])}
                  </text>
                )}
              </g>
            );
          })}
          {/* Keyboard access: one focusable hit target per x position */}
          {labels.map((label, i) => (
            <rect
              key={`hit-${i}`}
              x={x(i) - Math.max(12, innerW / Math.max(1, labels.length - 1) / 2)}
              y={PAD.top}
              width={Math.max(24, innerW / Math.max(1, labels.length - 1))}
              height={innerH}
              fill="transparent"
              tabIndex={0}
              aria-label={`${tooltipLabels?.[i] ?? label}: ${series.map((s) => `${s.name} ${formatValue(s.values[i])}`).join(', ')}`}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="focus:outline-none"
            />
          ))}
        </svg>
        {active !== null && (
          <div
            role="presentation"
            className="pointer-events-none absolute z-10 min-w-[160px] -translate-x-1/2 rounded-[12px] border border-border bg-surface-elevated px-3 py-2.5 text-[12.5px] shadow-pop"
            style={{ left: Math.min(Math.max(x(active), 80), width - 80), top: 0 }}
          >
            <p className="mb-1 font-semibold text-foreground">{tooltipLabels?.[active] ?? labels[active]}</p>
            {series.map((s) => (
              <p key={s.id} className="flex items-center justify-between gap-4 text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold tabular-nums text-foreground">{formatValue(s.values[active])}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
