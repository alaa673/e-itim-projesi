import clsx from 'clsx';
import { forwardRef, type TextareaHTMLAttributes, useId } from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  hideLabel?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, className, containerClassName, rows = 4, hideLabel, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = [error ? `${fieldId}-error` : null, hint ? `${fieldId}-hint` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={fieldId} className={hideLabel ? 'sr-only' : 'field-label'}>
          {label}
        </label>
      )}
      <textarea ref={ref} id={fieldId} rows={rows} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={clsx('control', className)} {...rest} />
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-[13px] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-danger">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
});
