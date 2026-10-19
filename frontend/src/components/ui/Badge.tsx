import clsx from 'clsx';
import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'achievement' | 'lime';

const TONES: Record<BadgeTone, { box: string; dot: string }> = {
  neutral: { box: 'bg-foreground/[0.06] text-muted-foreground', dot: 'bg-muted-foreground' },
  success: { box: 'bg-success/[0.10] text-success', dot: 'bg-success' },
  warning: { box: 'bg-warning/[0.11] text-warning', dot: 'bg-warning' },
  danger: { box: 'bg-danger/[0.10] text-danger', dot: 'bg-danger' },
  info: { box: 'bg-info/[0.10] text-info', dot: 'bg-info' },
  accent: { box: 'bg-accent-soft text-accent-ink', dot: 'bg-primary' },
  achievement: { box: 'bg-achievement-soft text-achievement-ink', dot: 'bg-achievement' },
  lime: { box: 'bg-lime-soft text-lime-ink', dot: 'bg-lime-ink' },
};

/** Status chip. Colour is always paired with text (and a dot or icon) — never colour alone. */
export function Badge({
  tone = 'neutral',
  icon,
  dot,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  /** Show a coloured dot before the label (as in the PUSULA tables). */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-semibold leading-none', t.box, className)}>
      {dot && <span aria-hidden className={clsx('h-1.5 w-1.5 rounded-full', t.dot)} />}
      {icon}
      {children}
    </span>
  );
}
