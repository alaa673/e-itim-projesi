/** Score colour used across tables: <50 red, <60 amber, otherwise green (always shown with the number). */
export function scoreTone(percent: number): 'danger' | 'warning' | 'success' {
  if (percent < 50) return 'danger';
  if (percent < 60) return 'warning';
  return 'success';
}
