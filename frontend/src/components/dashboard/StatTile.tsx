import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TONE_CARD, TONE_TILE, type Tone } from './tones';

interface StatTileProps {
  label: ReactNode;
  value: ReactNode;
  icon: LucideIcon;
  tone?: Exclude<Tone, 'role' | 'neutral'>;
  /** pastel: whole card tinted (teacher mockup) · plain: white card with tinted icon (admin mockup) */
  variant?: 'pastel' | 'plain';
  to?: string;
  /** Change vs. previous period, e.g. { value: '%12', up: true, label: 'Geçen aya göre' } */
  delta?: { value: string; up: boolean; label: string };
  className?: string;
}

/** Summary figure card. Links get a chevron and lift on hover. */
export function StatTile({ label, value, icon: Icon, tone = 'violet', variant = 'pastel', to, delta, className }: StatTileProps) {
  const pastel = variant === 'pastel';
  const body = (
    <>
      <span className={clsx('icon-tile h-14 w-14', pastel ? TONE_CARD[tone].tile : TONE_TILE[tone])}>
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold text-foreground">{label}</span>
        <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2.5">
          <span className="font-display text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-foreground">{value}</span>
          {delta && (
            <span className="inline-flex flex-col leading-tight">
              <span className={clsx('inline-flex items-center gap-0.5 text-[13px] font-bold', delta.up ? 'text-success' : 'text-danger')}>
                {delta.up ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
                {delta.value}
              </span>
              <span className="text-[11.5px] text-muted-foreground">{delta.label}</span>
            </span>
          )}
        </span>
      </span>
      {to && <ChevronRight className="h-5 w-5 shrink-0 text-foreground/70 transition-transform group-hover:translate-x-0.5" aria-hidden />}
    </>
  );
  const cls = clsx(
    'group flex items-center gap-4 rounded-panel border px-5 py-4',
    pastel ? TONE_CARD[tone].card : 'border-border bg-surface shadow-card',
    className,
  );
  return to ? (
    <Link to={to} className={clsx(cls, 'card-interactive')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
