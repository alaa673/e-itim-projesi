import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { API_BASE_URL, IS_MOCK_MODE } from '@/config/constants';
import { resolveFileUrl } from '@/utils/fileUrl';

/**
 * Demo mode only: illustrated portraits of the demo people, loaded on demand so a real build
 * ships none of them. Real users show their `avatarUrl` or their initials.
 */
let portraits: Record<string, string> | null = null;
const portraitsReady = IS_MOCK_MODE
  ? import('@/mocks/portraits').then((m) => {
      portraits = m.PORTRAITS;
    })
  : null;

function useDemoPortrait(name: string): string | undefined {
  const [, setLoaded] = useState(portraits !== null);
  useEffect(() => {
    if (!portraitsReady || portraits) return;
    let alive = true;
    void portraitsReady.then(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);
  return portraits?.[name];
}

/** Initials use the shared pastel tints (identity for people, independent of the viewer's role). */
const PALETTE = [
  'bg-tint-violet text-ink-violet',
  'bg-tint-mint text-ink-mint',
  'bg-tint-peach text-ink-peach',
  'bg-tint-sky text-ink-sky',
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

export function Avatar({ name, size = 36, className, src }: { name: string; size?: number; className?: string; src?: string | null }) {
  const demoPortrait = useDemoPortrait(name);
  const image = resolveFileUrl(src, API_BASE_URL) ?? demoPortrait;
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (image) {
    return (
      <span aria-hidden style={style} className={clsx('inline-flex shrink-0 overflow-hidden rounded-full bg-tint-violet', className)}>
        <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
      </span>
    );
  }
  const parts = name.trim().split(/\s+/);
  const letters = `${parts[0]?.charAt(0) ?? ''}${parts.length > 1 ? parts[parts.length - 1].charAt(0) : ''}`.toLocaleUpperCase('tr-TR');
  return (
    <span
      aria-hidden
      style={style}
      className={clsx('inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold', PALETTE[hash(name) % PALETTE.length], className)}
    >
      {letters}
    </span>
  );
}
