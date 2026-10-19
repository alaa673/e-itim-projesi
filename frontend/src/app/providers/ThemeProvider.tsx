import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '@/config/constants';
import type { ThemeName } from '@/types';
import { readStorage, writeStorage } from '@/utils/storage';
import { ThemeContext, type ThemeContextValue } from './themeContext';

function systemTheme(): ThemeName {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function attributeTheme(): ThemeName | null {
  const value = typeof document !== 'undefined' ? document.documentElement.dataset.theme : undefined;
  return value === 'light' || value === 'dark' ? value : null;
}

function initialTheme(): ThemeName {
  const saved = readStorage(STORAGE_KEYS.theme);
  if (saved === 'light' || saved === 'dark') return saved;
  return attributeTheme() ?? systemTheme();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme);
  const [userChose, setUserChose] = useState(() => readStorage(STORAGE_KEYS.theme) !== null);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  // Follow the OS (or an embedding page that sets data-theme) until the user picks a theme explicitly.
  useEffect(() => {
    if (userChose) return;
    const query = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = () => setThemeState(query?.matches ? 'dark' : 'light');
    query?.addEventListener?.('change', onChange);
    const observer = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => {
          const next = attributeTheme();
          if (next) setThemeState(next);
        })
      : null;
    observer?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      query?.removeEventListener?.('change', onChange);
      observer?.disconnect();
    };
  }, [userChose]);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    setUserChose(true);
    writeStorage(STORAGE_KEYS.theme, next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark') }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

