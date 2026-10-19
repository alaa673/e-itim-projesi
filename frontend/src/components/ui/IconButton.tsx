import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  /** Accessible name (also shown as tooltip). */
  label: string;
  tone?: 'neutral' | 'danger' | 'accent';
  size?: 'sm' | 'md';
}

const TONES = {
  neutral: 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground',
  danger: 'text-muted-foreground hover:bg-danger/10 hover:text-danger',
  accent: 'text-accent-ink hover:bg-accent-soft',
};

/** Square icon-only button for table rows and toolbars. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, tone = 'neutral', size = 'sm', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-[9px] transition-colors disabled:pointer-events-none disabled:opacity-30',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
});
