import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PusulaMark } from '@/components/brand/PusulaLogo';
import { Button } from '@/components/ui/Button';

export interface DeckSlide {
  title: string;
  bullets: string[];
}

/** 16:9 slide viewer with arrows, keyboard navigation and full-screen presenting. */
export function SlideDeck({ slides, title }: { slides: DeckSlide[]; title: string }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => setIndex(0), [slides]);
  const slide = slides[index];
  const go = (to: number) => setIndex(Math.max(0, Math.min(slides.length - 1, to)));
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      go(index - 1);
    }
  };
  if (!slide) return null;
  return (
    <div>
      <div
        ref={frame}
        tabIndex={0}
        onKeyDown={onKey}
        role="region"
        aria-roledescription={t('slides.deck')}
        aria-label={`${title} — ${t('slides.position', { current: index + 1, total: slides.length })}`}
        className="relative flex aspect-video w-full flex-col overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#2a1458,#47237f_60%,#6c3be6)] p-[6%] text-white outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring [&:fullscreen]:rounded-none"
      >
        <span aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#d4f46a]/20 blur-2xl" />
        <p className="text-[clamp(10px,1.4vw,14px)] font-bold uppercase tracking-[0.14em] text-white/70">{title}</p>
        <h3 className="mt-[2%] font-display text-[clamp(18px,3.6vw,40px)] font-extrabold leading-tight" aria-live="polite">
          {slide.title}
        </h3>
        <ul className="mt-[3%] space-y-[1.5%] text-[clamp(12px,2vw,22px)] leading-snug">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden className="mt-[0.55em] h-2 w-2 shrink-0 rounded-full bg-[#d4f46a]" />
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center justify-between text-[clamp(10px,1.2vw,13px)] text-white/70">
          <span className="flex items-center gap-2">
            <PusulaMark size={20} />
            PUSULA
          </span>
          <span className="tabular-nums">
            {index + 1} / {slides.length}
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" role="tablist" aria-label={t('slides.list')}>
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1}. ${s.title}`}
              onClick={() => setIndex(i)}
              className={clsx('h-2.5 rounded-full transition-all', i === index ? 'w-6 bg-primary' : 'w-2.5 bg-foreground/20 hover:bg-foreground/40')}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => go(index - 1)} disabled={index === 0} icon={<ChevronLeft className="h-4 w-4" aria-hidden />}>
            {t('actions.previous')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => go(index + 1)} disabled={index === slides.length - 1} iconEnd={<ChevronRight className="h-4 w-4" aria-hidden />}>
            {t('actions.next')}
          </Button>
          <Button
            variant="soft"
            size="sm"
            icon={<Maximize2 className="h-4 w-4" aria-hidden />}
            onClick={() => {
              const el = frame.current;
              if (el?.requestFullscreen) void el.requestFullscreen().then(() => el.focus());
            }}
          >
            {t('slides.present')}
          </Button>
        </div>
      </div>
    </div>
  );
}
