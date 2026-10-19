import clsx from 'clsx';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES } from '@/config/constants';
import { useDismiss } from '@/hooks/useDismiss';

const NAMES: Record<string, string> = { tr: 'Türkçe', en: 'English' };

/** "🌐 Türkçe ▾" language picker (Turkish / English only). */
export function LanguageMenu({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const current = i18n.resolvedLanguage === 'en' ? 'en' : 'tr';
  return (
    <div ref={ref} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${t('header.language')}: ${NAMES[current]}`}
        className="inline-flex h-12 items-center gap-2.5 rounded-[14px] border border-border bg-surface px-4 text-[15px] font-medium text-foreground shadow-card transition-colors hover:border-primary/40"
      >
        <Globe className="h-5 w-5" aria-hidden />
        {NAMES[current]}
        <ChevronDown className={clsx('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-40 w-48 animate-pop-in rounded-[16px] border border-border bg-surface-elevated p-1.5 shadow-pop">
          {SUPPORTED_LOCALES.map((lng) => (
            <button
              key={lng}
              type="button"
              role="menuitemradio"
              aria-checked={current === lng}
              lang={lng}
              onClick={() => {
                void i18n.changeLanguage(lng);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-[11px] px-3 py-2.5 text-left text-[14.5px] font-medium text-foreground hover:bg-accent-soft hover:text-accent-ink"
            >
              {NAMES[lng]}
              {current === lng && <Check className="h-4 w-4" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
