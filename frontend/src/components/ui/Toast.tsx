import clsx from 'clsx';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToastContext, type ToastItem } from './toastContext';

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const TONES = { success: 'bg-success/10 text-success', error: 'bg-danger/10 text-danger', info: 'bg-info/10 text-info' };
const BARS = { success: 'bg-success', error: 'bg-danger', info: 'bg-info' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const notify = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), toast.tone === 'error' ? 7000 : 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto relative flex w-full max-w-sm animate-pop-in items-start gap-3 overflow-hidden rounded-panel border border-border bg-surface-elevated p-4 pl-5 shadow-pop"
            >
              <span aria-hidden className={clsx('absolute inset-y-0 left-0 w-1', BARS[toast.tone])} />
              <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]', TONES[toast.tone])}>
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-[13px] text-muted-foreground">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="-m-1 rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label={t('actions.close')}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

