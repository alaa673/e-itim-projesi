import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/toastContext';
import { IS_MOCK_MODE } from '@/config/constants';
import { errorMessageKey } from '@/utils/errorHandling';

/**
 * Runs a mutation with a busy flag and toasts. In mock mode the success toast says the change is
 * kept for this browser session only (it is never presented as saved on a server).
 */
export function useAction() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async <T,>(task: () => Promise<T>, messages: { success?: string; description?: string; error?: string } = {}): Promise<T | undefined> => {
      setBusy(true);
      try {
        const result = await task();
        if (messages.success) {
          notify({ tone: 'success', title: messages.success, description: messages.description ?? (IS_MOCK_MODE ? t('demo.notPersisted') : undefined) });
        }
        return result;
      } catch (error) {
        notify({ tone: 'error', title: messages.error ?? t('states.errorTitle'), description: t(errorMessageKey(error)) });
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [notify, t],
  );

  return { run, busy };
}
