import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IS_MOCK_MODE } from '@/config/constants';

/** Shown on screens with guidance data while the app runs on demo data (fictional schools, programmes, scores). */
export function DemoDataNote({ className }: { className?: string }) {
  const { t } = useTranslation();
  if (!IS_MOCK_MODE) return null;
  return (
    <p className={`mb-4 flex gap-2 rounded-[14px] border border-info/25 bg-info/[0.07] px-4 py-3 text-[13.5px] text-foreground ${className ?? ''}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
      {t('common.demoDataNote')}
    </p>
  );
}
