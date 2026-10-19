/**
 * Shared colour treatments for icon tiles and pastel cards.
 * Pastel tints use their text-safe "ink" step, so icons and labels keep AA contrast in both themes.
 */
export type Tone = 'role' | 'violet' | 'mint' | 'peach' | 'sky' | 'lime' | 'neutral';

/** Icon tile on a white card. */
export const TONE_TILE: Record<Tone, string> = {
  role: 'bg-primary text-primary-foreground shadow-[0_8px_16px_-8px_rgb(var(--primary)/0.8)]',
  violet: 'bg-tint-violet text-ink-violet',
  mint: 'bg-tint-mint text-ink-mint',
  peach: 'bg-tint-peach text-ink-peach',
  sky: 'bg-tint-sky text-ink-sky',
  lime: 'bg-lime text-lime-foreground',
  neutral: 'bg-foreground/[0.06] text-muted-foreground',
};

/** Whole pastel card + the stronger tile that sits on it. */
export const TONE_CARD: Record<Exclude<Tone, 'role' | 'neutral'>, { card: string; tile: string; text: string }> = {
  violet: { card: 'bg-tint-violet border-transparent', tile: 'bg-surface/70 text-ink-violet', text: 'text-ink-violet' },
  mint: { card: 'bg-tint-mint border-transparent', tile: 'bg-surface/70 text-ink-mint', text: 'text-ink-mint' },
  peach: { card: 'bg-tint-peach border-transparent', tile: 'bg-surface/70 text-ink-peach', text: 'text-ink-peach' },
  sky: { card: 'bg-tint-sky border-transparent', tile: 'bg-surface/70 text-ink-sky', text: 'text-ink-sky' },
  lime: { card: 'bg-lime-soft border-transparent', tile: 'bg-lime text-lime-foreground', text: 'text-lime-ink' },
};

export const TONE_BAR: Record<Tone, string> = {
  role: 'bg-primary',
  violet: 'bg-chart-1',
  mint: 'bg-success',
  peach: 'bg-achievement',
  sky: 'bg-info',
  lime: 'bg-lime-ink',
  neutral: 'bg-foreground/20',
};
