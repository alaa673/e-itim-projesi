import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES } from '@/config/constants';

export type ControlTone = 'default' | 'glass' | 'adaptive';

/** Container / active / idle classes per tone. `adaptive` = glass below lg (over the login header), default from lg. */
const TONES: Record<ControlTone, { box: string; active: string; idle: string }> = {
  default: {
    box: 'border-border bg-surface-muted',
    active: 'bg-surface text-accent-ink shadow-sm ring-1 ring-inset ring-primary/20',
    idle: 'text-muted-foreground hover:text-foreground',
  },
  glass: {
    box: 'border-white/25 bg-black/[0.14] backdrop-blur-sm',
    active: 'bg-white text-midnight shadow-sm',
    idle: 'text-white hover:bg-white/10',
  },
  adaptive: {
    box: 'border-white/25 bg-black/[0.14] backdrop-blur-sm lg:border-border lg:bg-surface-muted lg:backdrop-blur-none',
    active: 'bg-white text-midnight shadow-sm lg:bg-surface lg:text-accent-ink lg:ring-1 lg:ring-inset lg:ring-primary/20',
    idle: 'text-white hover:bg-white/10 lg:text-muted-foreground lg:hover:bg-transparent lg:hover:text-foreground',
  },
};

/** Turkish / English only. */
export function LanguageSwitcher({ className, tone = 'default' }: { className?: string; tone?: ControlTone }) {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage === 'en' ? 'en' : 'tr';
  const style = TONES[tone];
  return (
    <div role="group" aria-label={t('header.language')} className={clsx('inline-flex rounded-control border p-0.5', style.box, className)}>
      {SUPPORTED_LOCALES.map((lng) => {
        const active = current === lng;
        return (
          <button
            key={lng}
            type="button"
            lang={lng}
            aria-pressed={active}
            onClick={() => void i18n.changeLanguage(lng)}
            className={clsx(
              'h-8 min-w-[38px] rounded-[9px] px-2 text-[12.5px] font-bold uppercase tracking-wide transition-colors',
              active ? style.active : style.idle,
            )}
          >
            {lng === 'tr' ? 'TR' : 'EN'}
            <span className="sr-only">{lng === 'tr' ? ' – Türkçe' : ' – English'}</span>
          </button>
        );
      })}
    </div>
  );
}
