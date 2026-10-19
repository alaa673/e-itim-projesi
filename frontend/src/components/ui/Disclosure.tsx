import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';

/**
 * Accessible show/hide block: a button with aria-expanded controls a region.
 * Used for FAQ answers and request threads.
 */
export function Disclosure({
  summary,
  children,
  className,
  buttonClassName,
  defaultOpen = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
  buttonClassName?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={clsx('rounded-[14px] border transition-colors', open ? 'border-primary/30 bg-accent-soft/40' : 'border-border bg-surface', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={clsx('flex w-full items-center gap-3 rounded-[14px] px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', buttonClassName)}
      >
        <span className="min-w-0 flex-1">{summary}</span>
        <ChevronDown className={clsx('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      <div id={id} role="region" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
