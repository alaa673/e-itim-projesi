import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Burst, HandArrow, Sparkle } from '@/components/brand/Sparkle';

interface HeroBannerProps {
  /** Small line above the title (e.g. "Merhaba Deniz!"). */
  greeting?: ReactNode;
  /** Plain line under the greeting (e.g. "Bugünkü yolculuğuna kaldığın yerden devam et."). */
  lead?: ReactNode;
  /** Uppercase eyebrow with a spark (e.g. "PUSULA İLE DAHA VERİMLİ YÖNETİM"). */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Decorative illustration (aria-hidden) placed on the right. */
  illustration?: string;
  /** Tailwind classes for the illustration box (width/position). */
  illustrationClassName?: string;
  /** Short handwritten note on the illustration (decorative, repeats nothing essential). */
  note?: ReactNode;
  noteClassName?: string;
  className?: string;
  size?: 'md' | 'lg';
}

/**
 * PUSULA page hero: pastel role gradient, heavy headline, call-to-action pills and a 3D illustration
 * that fades into the gradient. Colours come from --banner-* of the active role.
 */
export function HeroBanner({
  greeting,
  lead,
  eyebrow,
  title,
  description,
  actions,
  illustration,
  illustrationClassName,
  note,
  noteClassName,
  className,
  size = 'lg',
}: HeroBannerProps) {
  return (
    <section className={clsx('hero-banner mb-6 motion-safe:animate-rise-in', className)}>
      {illustration && (
        <div
          aria-hidden
          className={clsx(
            'pointer-events-none absolute inset-y-0 right-0 hidden select-none sm:block',
            '[mask-image:linear-gradient(90deg,transparent_0%,black_22%)]',
            illustrationClassName ?? 'w-[46%]',
          )}
        >
          <img src={illustration} alt="" className="h-full w-full object-cover object-left" decoding="async" />
        </div>
      )}
      {note && (
        <p aria-hidden className={clsx('hand pointer-events-none absolute hidden -rotate-6 text-[22px] leading-[1.05] text-banner-ink/85 xl:block', noteClassName)}>
          {note}
          <HandArrow className="ml-6 mt-1 h-5 w-14 text-banner-ink/70" />
        </p>
      )}
      <div className={clsx('relative max-w-[640px] px-6 sm:px-9', size === 'lg' ? 'py-8 sm:py-10' : 'py-7 sm:py-8', illustration && 'sm:max-w-[58%]')}>
        {eyebrow && (
          <p className="mb-2 inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.12em] text-banner-ink/80">
            <Sparkle className="h-4 w-4 text-brand-amber" />
            {eyebrow}
          </p>
        )}
        {greeting && (
          <p className="mb-1 inline-flex items-center gap-2 font-display text-[18px] font-extrabold text-banner-ink">
            <Burst className="h-5 w-5 text-brand-amber" />
            {greeting}
          </p>
        )}
        {lead && <p className="mb-3 text-[15.5px] text-banner-ink/85 sm:text-[16.5px]">{lead}</p>}
        <h1
          className={clsx(
            'font-display font-extrabold leading-[1.02] tracking-[-0.035em] text-banner-ink',
            size === 'lg' ? 'text-[34px] sm:text-[46px] xl:text-[56px]' : 'text-[30px] sm:text-[40px] xl:text-[48px]',
          )}
        >
          {title}
        </h1>
        {description && <p className="mt-3 max-w-[52ch] text-[15.5px] leading-relaxed text-banner-ink/85 sm:text-[16.5px]">{description}</p>}
        {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </section>
  );
}
