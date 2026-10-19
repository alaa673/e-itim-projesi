import clsx from 'clsx';
import { CloudOff, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { errorMessageKey } from '@/utils/errorHandling';
import { Button } from './Button';

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex flex-col items-center px-6 py-12 text-center', className)}>
      <span className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-accent-soft text-accent-ink">
        <span aria-hidden className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full bg-lime" />
        {icon ?? <SearchX className="h-7 w-7" aria-hidden />}
      </span>
      <p className="font-display text-[17px] font-bold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[14px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className, compact }: { error: unknown; onRetry?: () => void; className?: string; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className={clsx('flex flex-col items-center text-center', compact ? 'px-4 py-6' : 'px-6 py-12', className)}>
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-danger/10 text-danger">
        <CloudOff className="h-7 w-7" aria-hidden />
      </span>
      <p className="font-display text-[17px] font-bold text-foreground">{t('states.errorTitle')}</p>
      <p className="mt-1 max-w-sm text-[14px] text-muted-foreground">{t(errorMessageKey(error))}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          {t('actions.retry')}
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={clsx('skeleton', className)} />;
}

/** Placeholder shown while a page's data loads. */
export function PageSkeleton() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t('states.loading')} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[96px] rounded-panel" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-panel lg:col-span-2" />
        <Skeleton className="h-72 rounded-panel" />
      </div>
    </div>
  );
}

/** Wraps async page content: skeleton while loading, error with retry, then children. */
export function AsyncContent<T>({
  data,
  error,
  loading,
  reload,
  skeleton,
  children,
}: {
  data: T | null | undefined;
  error: unknown;
  loading: boolean;
  reload: () => void;
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (data) return <>{children(data)}</>;
  if (error && !loading)
    return (
      <div className="panel">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  return <>{skeleton ?? <PageSkeleton />}</>;
}
