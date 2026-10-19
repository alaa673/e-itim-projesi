import clsx from 'clsx';
import { useId } from 'react';

interface SegmentedControlProps<V extends string> {
  label: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (value: V) => void;
  size?: 'sm' | 'md';
  hideLabel?: boolean;
  className?: string;
  tone?: 'accent' | 'neutral';
}

/** Radio-group semantics rendered as a segmented button bar. */
export function SegmentedControl<V extends string>({ label, value, options, onChange, size = 'md', hideLabel, className, tone = 'accent' }: SegmentedControlProps<V>) {
  const name = useId();
  return (
    <fieldset className={className}>
      <legend className={clsx('field-label', hideLabel && 'sr-only')}>{label}</legend>
      <div className={clsx('inline-flex max-w-full flex-wrap rounded-control border border-border bg-surface-muted p-1', size === 'sm' ? 'gap-0.5' : 'gap-1')}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={clsx(
                'relative cursor-pointer rounded-[9px] font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                size === 'sm' ? 'px-2.5 py-1 text-[12.5px]' : 'px-3.5 py-1.5 text-sm',
                checked
                  ? tone === 'accent'
                    ? 'bg-primary text-primary-foreground shadow-[0_4px_12px_-6px_rgb(var(--primary)/0.8)]'
                    : 'bg-surface text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
