import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  /** Element rendered inside the field on the trailing side (e.g. show-password toggle). */
  trailing?: ReactNode;
  /** Decorative icon on the leading side. */
  leading?: ReactNode;
  containerClassName?: string;
  /** lg: taller field with larger radius (sign-in form). */
  size?: 'md' | 'lg';
  /** Keep the label for screen readers only. */
  hideLabel?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, trailing, leading, id, className, containerClassName, size = 'md', hideLabel, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null].filter(Boolean).join(' ') || undefined;
  const large = size === 'lg';

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={inputId} className={hideLabel ? 'sr-only' : 'field-label'}>
          {label}
        </label>
      )}
      <div className="group/field relative">
        {leading && (
          <span
            className={clsx(
              'pointer-events-none absolute inset-y-0 flex items-center text-muted-foreground transition-colors group-focus-within/field:text-accent-ink',
              large ? 'left-4' : 'left-3',
              error && 'text-danger group-focus-within/field:text-danger',
            )}
          >
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={clsx(
            'control',
            large && 'h-12 rounded-[14px] text-[15.5px]',
            leading && (large ? 'pl-11' : 'pl-10'),
            trailing && (large ? 'pr-12' : 'pr-11'),
            className,
          )}
          {...rest}
        />
        {trailing && <span className={clsx('absolute inset-y-0 flex items-center', large ? 'right-1.5' : 'right-1')}>{trailing}</span>}
      </div>
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[13px] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
});
