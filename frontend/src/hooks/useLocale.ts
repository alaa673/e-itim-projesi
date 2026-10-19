import { useTranslation } from 'react-i18next';
import type { Locale } from '@/types';

/** Current UI locale, narrowed to the two supported languages. */
export function useLocale(): Locale {
  const { i18n } = useTranslation();
  return i18n.resolvedLanguage === 'en' ? 'en' : 'tr';
}
