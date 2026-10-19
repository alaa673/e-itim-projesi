import clsx from 'clsx';
import { useId } from 'react';

/**
 * PUSULA mark: an open book — violet cover on the left, lime outline page on the right —
 * with a small spark. Wordmark and optional area line ("Öğrenci alanı").
 */
export function PusulaMark({ size = 44, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className={clsx('shrink-0', className)}>
      <defs>
        <linearGradient id={`${id}-cover`} x1="6" y1="8" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#B08CFF" />
          <stop offset="1" stopColor="#6C3BE6" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="6" y1="10" x2="10" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#7F52F0" />
          <stop offset="1" stopColor="#4A22B8" />
        </linearGradient>
      </defs>
      {/* spine depth */}
      <path d="M6 12.5 10.5 9v31L6 43.5z" fill={`url(#${id}-side)`} />
      {/* violet cover */}
      <path d="M10.5 9 24 13.5v31L10.5 40z" fill={`url(#${id}-cover)`} />
      {/* lime outline page */}
      <path d="M24 13.5 39.5 8.5v31L24 44.5z" fill="none" stroke="#D4F46A" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M24 13.5v31" stroke="#D4F46A" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function PusulaLogo({
  area,
  size = 'md',
  tone = 'light',
  className,
}: {
  /** Small line under the wordmark, e.g. "Öğrenci alanı". */
  area?: string;
  size?: 'sm' | 'md' | 'lg';
  /** light: white wordmark (dark backgrounds) · dark: ink wordmark (light backgrounds) */
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const mark = { sm: 34, md: 44, lg: 52 }[size];
  return (
    <span className={clsx('relative inline-flex items-center gap-3', className)}>
      <PusulaMark size={mark} />
      <span className="leading-none">
        <span
          className={clsx(
            'block font-display font-extrabold tracking-[0.02em]',
            size === 'sm' ? 'text-[20px]' : size === 'lg' ? 'text-[32px]' : 'text-[26px]',
            tone === 'light' ? 'text-white' : 'text-foreground',
          )}
        >
          PUSULA
        </span>
        {area && <span className={clsx('mt-1 block text-[14px]', tone === 'light' ? 'text-sidebar-muted' : 'text-muted-foreground')}>{area}</span>}
      </span>
      <svg aria-hidden viewBox="0 0 24 24" className="absolute -right-5 -top-1 h-4 w-4 text-brand-amber motion-safe:animate-twinkle">
        <path d="M12 1.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5Z" fill="currentColor" />
      </svg>
    </span>
  );
}
