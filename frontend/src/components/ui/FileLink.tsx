import clsx from 'clsx';
import { Download, Paperclip } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, IS_MOCK_MODE } from '@/config/constants';
import { resolveFileUrl } from '@/utils/fileUrl';

/**
 * A file the server stores (a PDF, a homework upload…). With a safe URL from the API it is a download
 * link; without one (demo data, or no permission) only the name is shown.
 */
export function FileLink({ name, url, className }: { name: string; url?: string | null; className?: string }) {
  const { t } = useTranslation();
  const href = resolveFileUrl(url, API_BASE_URL);
  const box = clsx('inline-flex max-w-full items-center gap-2 rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]', className);
  if (!href) {
    return (
      <span className={box}>
        <Paperclip className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{name}</span>
        {IS_MOCK_MODE && <span className="shrink-0 text-muted-foreground">· {t('files.demo')}</span>}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={clsx(box, 'font-semibold text-accent-ink transition-colors hover:border-primary/40')}>
      <Paperclip className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{name}</span>
      <Download className="h-4 w-4 shrink-0" aria-hidden />
      <span className="sr-only">({t('files.opensNewTab')})</span>
    </a>
  );
}
