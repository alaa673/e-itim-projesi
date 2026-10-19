import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { forwardRef, type SelectHTMLAttributes, useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  /** Optional first option with an empty value (e.g. "All levels"). */
  placeholderOption?: string;
  containerClassName?: string;
  /** Visually hide the label but keep it for screen readers. */
  hideLabel?: boolean;
  /** Marks an applied filter with the role identity (border + tint), in addition to the visible selected value. */
  highlight?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholderOption, id, className, containerClassName, hideLabel, highlight, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={selectId} className={clsx('field-label', hideLabel && 'sr-only')}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={clsx('control cursor-pointer appearance-none pr-9', highlight && 'border-primary/70 bg-accent-soft font-medium text-accent-ink', className)}
          {...rest}
        >
          {placeholderOption !== undefined && <option value="">{placeholderOption}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className={clsx('pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2', highlight ? 'text-accent-ink' : 'text-muted-foreground')} />
      </div>
      {error && (
        <p id={`${selectId}-error`} role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
