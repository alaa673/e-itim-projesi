import { FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Shown next to output that was produced by a demo template instead of the real AI service. */
export function SimulatedNote({ show, className }: { show: boolean; className?: string }) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <p role="note" className={`flex gap-2 rounded-[12px] border border-warning/30 bg-warning/[0.08] px-3 py-2.5 text-[13px] text-foreground ${className ?? ''}`}>
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
      {t('demo.aiSimulated')}
    </p>
  );
}
