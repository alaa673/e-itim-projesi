import clsx from 'clsx';
import { type KeyboardEvent, type ReactNode, useId, useRef } from 'react';

export interface TabItem<V extends string> {
  value: V;
  label: ReactNode;
  count?: number;
}

/** Underline tabs with roving focus (arrow keys). Render panels yourself with `tabPanelProps`. */
export function Tabs<V extends string>({
  label,
  items,
  value,
  onChange,
  className,
}: {
  label: string;
  items: TabItem<V>[];
  value: V;
  onChange: (value: V) => void;
  className?: string;
}) {
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (event: KeyboardEvent, index: number) => {
    const dir = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    event.preventDefault();
    const next = (index + dir + items.length) % items.length;
    refs.current[next]?.focus();
    onChange(items[next].value);
  };
  return (
    <div role="tablist" aria-label={label} className={clsx('scrollbar-none flex gap-1 relative overflow-x-auto border-b border-border', className)}>
      {items.map((item, i) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${base}-${item.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={clsx(
              'relative -mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 pb-3 pt-2 text-[14.5px] font-semibold transition-colors',
              selected ? 'text-accent-ink' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={clsx('rounded-full px-2 py-0.5 text-[11.5px]', selected ? 'bg-accent-soft text-accent-ink' : 'bg-foreground/[0.06]')}>{item.count}</span>
            )}
            {selected && <span aria-hidden className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}
