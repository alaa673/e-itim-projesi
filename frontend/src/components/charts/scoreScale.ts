/**
 * Diverging score scale (red ↔ neutral gray ↔ blue) used by heat cells.
 * Colours come from CSS tokens (--heat-1 … --heat-5) so light/dark each use their own steps.
 * Every cell also prints its number, so colour is never the only channel.
 */
export type HeatStep = 1 | 2 | 3 | 4 | 5;

/** Bins align with the review threshold (50%): everything below it reads as red. */
export function heatStep(percent: number): HeatStep {
  if (percent < 35) return 1;
  if (percent < 50) return 2;
  if (percent < 70) return 3;
  if (percent < 85) return 4;
  return 5;
}

/** Steps with a strong fill need light ink; the rest use the normal text colour. */
export function heatStyle(percent: number): { background: string; color: string } {
  const step = heatStep(percent);
  const strong = step === 1 || step === 5;
  return {
    background: `rgb(var(--heat-${step}))`,
    // Strong steps are dark fills in both themes (white text ≥5:1); lighter steps take the theme's text colour.
    color: strong ? 'rgb(255 255 255)' : 'rgb(var(--foreground))',
  };
}

export const HEAT_LEGEND: { step: HeatStep; range: string }[] = [
  { step: 1, range: '0–34' },
  { step: 2, range: '35–49' },
  { step: 3, range: '50–69' },
  { step: 4, range: '70–84' },
  { step: 5, range: '85–100' },
];
