import clsx from 'clsx';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/app/providers/themeContext';
import type { ControlTone } from './LanguageSwitcher';

const TONES: Record<ControlTone, string> = {
  default: 'border-border bg-surface text-foreground shadow-card hover:border-primary/40 hover:text-accent-ink',
  glass: 'border-white/25 bg-black/[0.14] text-white backdrop-blur-sm hover:bg-black/[0.22]',
  adaptive:
    'border-white/25 bg-black/[0.14] text-white backdrop-blur-sm hover:bg-black/[0.22] lg:border-border lg:bg-surface lg:text-foreground lg:backdrop-blur-none lg:hover:border-primary/40 lg:hover:bg-surface lg:hover:text-accent-ink',
};

/** Light/dark switch. */
export function ThemeToggle({ tone = 'default', className }: { tone?: ControlTone; className?: string }) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? t('header.toLight') : t('header.toDark');
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={clsx('flex h-10 w-10 items-center justify-center rounded-control border transition-colors', TONES[tone], className)}
    >
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" aria-hidden /> : <Moon className="h-[18px] w-[18px]" aria-hidden />}
    </button>
  );
}
