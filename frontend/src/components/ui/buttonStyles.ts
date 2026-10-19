import clsx from 'clsx';

/**
 * primary   – main action in the role colour (white text, AA in both themes)
 * ink       – deep role colour (banner and card calls to action, like the PUSULA mockups)
 * soft      – role-tinted secondary action (chips such as "Destek gönder")
 * secondary – neutral outlined
 * ghost     – text-only
 * danger    – destructive actions
 * lime      – the shared PUSULA highlight (sparingly: celebratory / next-step actions)
 * inverse   – white button for dark or saturated surfaces
 */
export type Variant = 'primary' | 'ink' | 'soft' | 'secondary' | 'ghost' | 'danger' | 'lime' | 'inverse';
export type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-[0_8px_18px_-10px_rgb(var(--primary)/0.9)] hover:bg-primary-hover',
  ink: 'bg-ink text-ink-foreground shadow-[0_8px_18px_-10px_rgb(var(--ink)/0.8)] hover:bg-ink/90',
  soft: 'bg-accent-soft text-accent-ink hover:bg-primary/[0.14]',
  secondary: 'border border-border bg-surface text-foreground shadow-card hover:border-primary/40 hover:text-accent-ink',
  ghost: 'text-foreground hover:bg-foreground/[0.06]',
  danger: 'bg-danger text-danger-foreground shadow-card hover:bg-danger/90',
  lime: 'bg-lime text-lime-foreground shadow-[0_8px_18px_-10px_rgb(var(--lime-ink)/0.8)] hover:brightness-95',
  inverse: 'bg-white text-[#1D1433] shadow-card hover:bg-white/90',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 gap-1.5 rounded-[10px] px-3.5 text-[13.5px]',
  md: 'h-11 gap-2 rounded-control px-4 text-[14.5px]',
  lg: 'h-12 gap-2 rounded-[14px] px-6 text-[15.5px]',
  icon: 'h-11 w-11 rounded-control p-0',
  'icon-sm': 'h-9 w-9 rounded-[10px] p-0',
};

/** Class list for links that should look like buttons (e.g. <Link className={buttonClass('secondary')} />). */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string): string {
  return clsx(
    'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition-[background-color,border-color,color,box-shadow,transform,filter] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}
