/**
 * Id for a nested item created in the browser (a subject unit or topic, a rubric criterion…).
 * The server must replace ids that start with "tmp-" with permanent ones when it saves the parent record.
 */
export function tempId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `tmp-${prefix}-${random}`;
}
