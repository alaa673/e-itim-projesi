import { Save, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

/** Sticky save bar shown while a settings page has unsaved changes. */
export function SaveBar({ dirty, saving, onSave, onReset }: { dirty: boolean; saving: boolean; onSave: () => void; onReset: () => void }) {
  const { t } = useTranslation(['admin', 'common']);
  return (
    <div className="sticky bottom-4 z-20 mt-6 flex justify-end">
      <div className="flex items-center gap-3 rounded-[18px] border border-border bg-surface-elevated px-4 py-3 shadow-pop">
        <span className="text-[13.5px] text-muted-foreground" aria-live="polite">
          {dirty ? t('settings.unsaved') : t('settings.allSaved')}
        </span>
        <Button variant="ghost" size="sm" icon={<Undo2 className="h-4 w-4" aria-hidden />} disabled={!dirty || saving} onClick={onReset}>
          {t('actions.reset', { ns: 'common' })}
        </Button>
        <Button size="sm" variant="ink" loading={saving} disabled={!dirty} icon={<Save className="h-4 w-4" aria-hidden />} onClick={onSave}>
          {t('actions.saveChanges', { ns: 'common' })}
        </Button>
      </div>
    </div>
  );
}
