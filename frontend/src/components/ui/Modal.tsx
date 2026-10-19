import clsx from 'clsx';
import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** side: slides in from the right (detail panels) */
  variant?: 'dialog' | 'side';
  /**
   * When true, Escape and the close button do nothing (e.g. while saving).
   * Clicking the backdrop never closes a dialog, so typed form data is not lost by accident.
   */
  preventClose?: boolean;
  /** Element to focus when the dialog opens (defaults to the first focusable element). */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
const SIDE_SIZES = { sm: 'max-w-[420px]', md: 'max-w-[560px]', lg: 'max-w-[720px]', xl: 'max-w-[920px]' };

/** Open dialogs, top-most last: only the top one reacts to Escape / Tab (stacked dialogs). */
const stack: symbol[] = [];

export function Modal({ open, title, description, onClose, children, footer, size = 'md', variant = 'dialog', preventClose, initialFocusRef }: ModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const preventRef = useRef(preventClose);
  preventRef.current = preventClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const first = initialFocusRef?.current ?? dialog?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog)?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const token = Symbol('dialog');
    stack.push(token);

    const onKeyDown = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token) return;
      if (event.key === 'Escape') {
        event.stopPropagation();
        if (!preventRef.current) onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (nodes.length === 0) return;
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      stack.splice(stack.indexOf(token), 1);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, initialFocusRef]);

  if (!open) return null;
  const side = variant === 'side';

  return createPortal(
    <div className={clsx('fixed inset-0 z-50 flex', side ? 'justify-end' : 'items-end justify-center p-0 sm:items-center sm:p-6')}>
      <div
        className="absolute inset-0 animate-fade-in bg-overlay/50 backdrop-blur-[3px]"
        aria-hidden
        onClick={side && !preventClose ? onClose : undefined}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={clsx(
          'relative flex w-full flex-col overflow-hidden border border-border bg-surface-elevated shadow-pop focus:outline-none',
          side
            ? clsx('h-full animate-pop-in sm:rounded-l-[24px]', SIDE_SIZES[size])
            : clsx('max-h-[92dvh] animate-pop-in rounded-t-[24px] sm:rounded-[24px]', SIZES[size]),
        )}
      >
        <header className="flex items-start gap-4 border-b border-border px-5 pb-4 pt-5 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-[20px] font-extrabold leading-snug">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-[14px] text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => !preventClose && onClose()}
            disabled={preventClose}
            className="-mr-2 -mt-1 rounded-control p-2 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-40"
            aria-label={t('actions.close')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface-muted/60 px-5 py-4 sm:px-6">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
