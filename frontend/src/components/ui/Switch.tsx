import clsx from 'clsx';
import { useId, type ReactNode } from 'react';

/** Accessible on/off switch (role="switch"). */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
  hideLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
  hideLabel?: boolean;
}) {
  const id = useId();
  return (
    <div className={clsx('flex items-start justify-between gap-4', className)}>
      <div className={clsx('min-w-0', hideLabel && 'sr-only')}>
        <label htmlFor={id} className="text-[14.5px] font-semibold text-foreground">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'border-primary bg-primary' : 'border-input/60 bg-foreground/[0.12]',
        )}
      >
        <span
          aria-hidden
          className={clsx('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-[3px]')}
        />
      </button>
    </div>
  );
}
