import clsx from 'clsx';

/** Four-point spark used as a small decorative accent (aria-hidden). */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={clsx('shrink-0', className)}>
      <path d="M12 1.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5Z" fill="currentColor" />
    </svg>
  );
}

/** Three short "burst" strokes, as on the illustrations (aria-hidden). */
export function Burst({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 28 28" fill="none" className={clsx('shrink-0', className)}>
      <path d="M4 14h6M8 4.5l3.5 5M17.5 4l-1 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** Hand-drawn curved arrow pointing down-right (aria-hidden). */
export function HandArrow({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 80 40" fill="none" className={clsx('shrink-0', className)}>
      <path d="M3 8c10 22 34 30 64 22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M58 22l10 8-12 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
