import clsx from 'clsx';
import type { ReactNode } from 'react';

/** Label/value pairs (semantic <dl>) for detail drawers. */
export function DetailList({ items, columns = 2, className }: { items: { label: ReactNode; value: ReactNode; full?: boolean }[]; columns?: 1 | 2 | 3; className?: string }) {
  return (
    <dl className={clsx('grid gap-x-6 gap-y-4', columns === 1 ? 'grid-cols-1' : columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3', className)}>
      {items.map((item, i) => (
        <div key={i} className={clsx('min-w-0', item.full && 'sm:col-span-full')}>
          <dt className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 break-words text-[14.5px] text-foreground">{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
