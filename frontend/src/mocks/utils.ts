/**
 * Helpers for the development-only mock adapters. Nothing in src/mocks is used when
 * VITE_API_MODE=real.
 */
import type { Locale } from '@/types';
import { ApiError } from '@/utils/errorHandling';

/** Deterministic PRNG (mulberry32) so demo data is identical on every load. */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Simulated network latency; honours AbortSignal like a real request. */
export function mockDelay<T>(produce: () => T, signal?: AbortSignal, ms = 320): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ApiError('aborted'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      try {
        resolve(produce());
      } catch (error) {
        reject(error);
      }
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new ApiError('aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Localised demo text (real backend would localise via Accept-Language). */
export function l(locale: Locale, tr: string, en: string): string {
  return locale === 'en' ? en : tr;
}

/** ISO date relative to today, at the given local time. */
export function relativeDate(days: number, hours = 9, minutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

const TR_MAP: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', İ: 'i', Ç: 'c', Ğ: 'g', Ö: 'o', Ş: 's', Ü: 'u' };

export function asciiSlug(value: string): string {
  return value
    .split('')
    .map((ch) => TR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export const FIRST_NAMES = [
  'Elif', 'Zeynep', 'Ecrin', 'Defne', 'Azra', 'Nehir', 'Ela', 'Asel', 'Duru', 'Yusuf',
  'Eymen', 'Ömer', 'Mustafa', 'Ali', 'Kerem', 'Emir', 'Mehmet', 'Ahmet', 'Aras', 'Göktuğ',
  'Berat', 'Hira', 'Meryem', 'Sena', 'İrem', 'Buse', 'Selin', 'Ceren', 'Tuana', 'Arda',
  'Burak', 'Can', 'Deniz', 'Efe', 'Kaan', 'Mert', 'Onur', 'Umut', 'Yiğit', 'Ayşe',
  'Esra', 'Melis', 'Nisa', 'Rüya', 'Beren', 'Doruk', 'Çınar', 'Batuhan', 'Ozan', 'Lina',
] as const;

export const LAST_NAMES = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir',
  'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek',
  'Polat', 'Korkmaz', 'Erdoğan', 'Güneş', 'Aksoy', 'Tekin', 'Bulut', 'Karaca', 'Akın', 'Ünal',
] as const;
