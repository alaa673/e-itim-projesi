import type { Locale } from '@/types';

const INTL_LOCALE: Record<Locale, string> = { tr: 'tr-TR', en: 'en-GB' };

export function toIntlLocale(locale: string): string {
  return INTL_LOCALE[(locale as Locale)] ?? INTL_LOCALE.tr;
}

export function formatDate(
  iso: string | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(toIntlLocale(locale), options).format(date);
}

export function formatTime(iso: string | Date, locale: string): string {
  return formatDate(iso, locale, { hour: '2-digit', minute: '2-digit' });
}

export function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(toIntlLocale(locale), options).format(value);
}

/** 0–100 → "%68" (tr) / "68%" (en) using locale rules. */
export function formatPercent(value: number, locale: string, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(toIntlLocale(locale), { style: 'percent', maximumFractionDigits }).format(value / 100);
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toLocaleUpperCase('tr-TR');
}

/** Whole days between today and the given date (negative = past). */
export function daysFromToday(iso: string, now: Date = new Date()): number {
  const target = new Date(iso);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOf(target) - startOf(now)) / 86_400_000);
}

/** Bytes → "2,4 MB" in the active locale. */
export function formatFileSize(bytes: number, locale = 'tr'): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${formatNumber(value, locale, { maximumFractionDigits: unit === 0 ? 0 : 1 })} ${units[unit]}`;
}

/** "14:00 – 14:30" style range in the active locale. */
export function formatTimeRange(startIso: string, endIso: string, locale: string): string {
  return `${formatTime(startIso, locale)} – ${formatTime(endIso, locale)}`;
}

/** Value for <input type="datetime-local"> in the user's time zone. */
export function toDateTimeLocal(iso: string | Date): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Value for <input type="date"> in the user's time zone. */
export function toDateInput(iso: string | Date): string {
  return toDateTimeLocal(iso).slice(0, 10);
}
