import clsx from 'clsx';
import { FileUp, Paperclip, X } from 'lucide-react';
import { type DragEvent, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatFileSize } from '@/utils/format';

interface FileDropProps {
  label: string;
  /** e.g. ".pdf" or ".csv,.txt" */
  accept: string;
  hint?: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  /** Maximum size per file in bytes. */
  maxSize?: number;
  error?: string;
  className?: string;
}

function matchesAccept(file: File, accept: string): boolean {
  const list = accept.split(',').map((a) => a.trim().toLowerCase());
  const name = file.name.toLowerCase();
  return list.some((a) => (a.startsWith('.') ? name.endsWith(a) : file.type === a));
}

/** Drag-and-drop or click-to-choose file field, with type and size checks before anything is sent. */
export function FileDrop({ label, accept, hint, multiple, files, onChange, maxSize = 25 * 1024 * 1024, error, className }: FileDropProps) {
  const { t } = useTranslation();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const take = (list: FileList | null) => {
    if (!list?.length) return;
    const picked = Array.from(list);
    const bad = picked.find((f) => !matchesAccept(f, accept));
    if (bad) {
      setLocalError(t('upload.wrongType', { name: bad.name, types: accept }));
      return;
    }
    const big = picked.find((f) => f.size > maxSize);
    if (big) {
      setLocalError(t('upload.tooLarge', { name: big.name, size: formatFileSize(maxSize) }));
      return;
    }
    setLocalError(null);
    onChange(multiple ? [...files, ...picked] : picked.slice(0, 1));
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    take(event.dataTransfer.files);
  };

  const shownError = error ?? localError ?? undefined;
  return (
    <div className={className}>
      <span id={`${id}-label`} className="field-label">
        {label}
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={clsx(
          'flex flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed px-5 py-7 text-center transition-colors',
          over ? 'border-primary bg-accent-soft' : shownError ? 'border-danger/60 bg-danger/[0.03]' : 'border-border bg-field hover:border-primary/50',
        )}
      >
        <span className="icon-tile h-12 w-12 bg-accent-soft text-accent-ink">
          <FileUp className="h-6 w-6" aria-hidden />
        </span>
        <p className="text-[14.5px] font-semibold text-foreground">{t('upload.dropHere')}</p>
        <button type="button" onClick={() => input.current?.click()} className="link-accent" aria-describedby={`${id}-label`}>
          {t('upload.choose')}
        </button>
        {hint && <p className="text-[12.5px] text-muted-foreground">{hint}</p>}
        <input
          ref={input}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          aria-labelledby={`${id}-label`}
          onChange={(e) => {
            take(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {shownError && (
        <p role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
          {shownError}
        </p>
      )}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-[12px] border border-border bg-surface px-3 py-2">
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-foreground">{file.name}</span>
              <span className="shrink-0 text-[12.5px] text-muted-foreground">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="rounded-md p-1 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"
                aria-label={t('upload.remove', { name: file.name })}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
