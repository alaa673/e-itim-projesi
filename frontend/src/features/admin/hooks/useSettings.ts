import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { type SettingsKey, type SettingsMap, settingsApi } from '../services/adminApi';

/** Loads one settings document, keeps an editable draft and saves it as a whole. */
export function useSettings<K extends SettingsKey>(key: K) {
  const { t } = useTranslation('admin');
  const source = useAsync((signal) => settingsApi.get(key, signal), [key]);
  const [baseline, setBaseline] = useState<SettingsMap[K] | null>(null);
  const [draft, setDraft] = useState<SettingsMap[K] | null>(null);
  const { run, busy } = useAction();
  useEffect(() => {
    if (!source.data) return;
    setBaseline(structuredClone(source.data));
    setDraft(structuredClone(source.data));
  }, [source.data]);
  const dirty = Boolean(draft && baseline && JSON.stringify(draft) !== JSON.stringify(baseline));
  const save = async () => {
    if (!draft) return;
    const saved = await run(() => settingsApi.save(key, draft), { success: t('settings.saved') });
    if (saved) {
      setBaseline(structuredClone(saved));
      setDraft(structuredClone(saved));
    }
  };
  const reset = () => baseline && setDraft(structuredClone(baseline));
  /** Apply a change the server already made (e.g. a new backup) without touching unsaved edits. */
  const applyServer = (patch: Partial<SettingsMap[K]>) => {
    setBaseline((b) => (b ? { ...b, ...patch } : b));
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };
  return { ...source, draft, setDraft, dirty, save, reset, applyServer, saving: busy };
}
