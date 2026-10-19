import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  error?: string | null;
  tone?: 'danger' | 'primary';
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, busy, error, tone = 'danger' }: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      preventClose={busy}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {t('actions.cancel')}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {tone === 'danger' && (
          <span className="icon-tile mt-0.5 h-11 w-11 bg-danger/10 text-danger">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
        )}
        <div className="text-[15px] text-foreground">{message}</div>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-control bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </Modal>
  );
}
