import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, STORAGE_KEYS, SUPPORTED_LOCALES } from '@/config/constants';
import { readStorage, writeStorage } from '@/utils/storage';
import enAccount from './locales/en/account.json';
import enAdmin from './locales/en/admin.json';
import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enShared from './locales/en/shared.json';
import enStudent from './locales/en/student.json';
import enTeacher from './locales/en/teacher.json';
import trAccount from './locales/tr/account.json';
import trAdmin from './locales/tr/admin.json';
import trAuth from './locales/tr/auth.json';
import trCommon from './locales/tr/common.json';
import trShared from './locales/tr/shared.json';
import trStudent from './locales/tr/student.json';
import trTeacher from './locales/tr/teacher.json';

export const NAMESPACES = ['common', 'auth', 'admin', 'teacher', 'student', 'shared', 'account'] as const;

export const resources = {
  tr: { common: trCommon, auth: trAuth, admin: trAdmin, teacher: trTeacher, student: trStudent, shared: trShared, account: trAccount },
  en: { common: enCommon, auth: enAuth, admin: enAdmin, teacher: enTeacher, student: enStudent, shared: enShared, account: enAccount },
} as const;

function initialLanguage(): string {
  const saved = readStorage(STORAGE_KEYS.language);
  return saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved) ? saved : DEFAULT_LOCALE;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage(),
  fallbackLng: DEFAULT_LOCALE, // Turkish is the default and the only fallback
  supportedLngs: [...SUPPORTED_LOCALES],
  ns: [...NAMESPACES],
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React already escapes output
  returnNull: false,
});

document.documentElement.lang = i18n.language;

i18n.on('languageChanged', (lng) => {
  writeStorage(STORAGE_KEYS.language, lng);
  document.documentElement.lang = lng;
});

export default i18n;
