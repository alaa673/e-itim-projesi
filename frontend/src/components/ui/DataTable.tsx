import clsx from 'clsx';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { IncrementalStatus } from '@/hooks/useIncrementalList';
import { errorMessageKey } from '@/utils/errorHandling';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { ErrorState, Skeleton } from './States';

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Makes the header a sort button; value passed to onSortChange. */
  sortKey?: string;
  /** Hide below the md breakpoint to keep small screens readable. */
  hideOnMobile?: boolean;
  className?: string;
  headerClassName?: string;
  /** Render as <th scope="row"> (the column that names the row). */
  rowHeader?: boolean;
}

interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  status: IncrementalStatus;
  error?: unknown;
  onRetry?: () => void;
  sort?: { key: string; direction: 'asc' | 'desc' };
  onSortChange?: (key: string) => void;
  empty: ReactNode;
  footer?: ReactNode;
  skeletonRows?: number;
  rowClassName?: (row: T) => string | undefined;
  /** Highlights the row being acted on (e.g. open in a dialog). */
  selectedRowId?: string | null;
  className?: string;
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  status,
  error,
  onRetry,
  sort,
  onSortChange,
  empty,
  footer,
  skeletonRows = 8,
  rowClassName,
  selectedRowId,
  className,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const initialLoading = status === 'loading' && rows.length === 0;
  const refreshing = status === 'loading' && rows.length > 0;

  if (status === 'error') {
    return (
      <div className={clsx('panel', className)}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className={clsx('panel overflow-hidden', className)}>
      <div className="scrollbar-thin relative overflow-x-auto">
        <table className={clsx('w-full border-collapse text-left text-sm transition-opacity', refreshing && 'opacity-55')} aria-busy={status === 'loading' || status === 'loadingMore'}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              {columns.map((column) => {
                const active = sort?.key === column.sortKey;
                const ariaSort = column.sortKey ? (active ? (sort?.direction === 'asc' ? 'ascending' : 'descending') : 'none') : undefined;
                const SortIcon = !active ? ArrowUpDown : sort?.direction === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={ariaSort}
                    className={clsx(
                      'whitespace-nowrap px-4 py-3.5 text-[13.5px] font-semibold text-muted-foreground first:pl-6 last:pr-6',
                      ALIGN[column.align ?? 'left'],
                      column.hideOnMobile && 'hidden md:table-cell',
                      column.headerClassName,
                    )}
                  >
                    {column.sortKey && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(column.sortKey as string)}
                        className={clsx('-mx-1 inline-flex items-center gap-1 rounded px-1 transition-colors hover:text-foreground', active && 'text-accent-ink')}
                        aria-label={t('table.sortBy', { column: column.header })}
                      >
                        {column.header}
                        <SortIcon className={clsx('h-3.5 w-3.5', !active && 'opacity-50')} aria-hidden />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {initialLoading &&
              Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={`sk-${i}`} className="border-b border-border last:border-0">
                  {columns.map((column) => (
                    <td key={column.id} className={clsx('px-4 py-4 first:pl-6 last:pr-6', column.hideOnMobile && 'hidden md:table-cell')}>
                      <Skeleton className="h-4 w-full max-w-[160px]" />
                    </td>
                  ))}
                </tr>
              ))}
            {!initialLoading &&
              rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  data-selected={selectedRowId === getRowId(row) || undefined}
                  className={clsx(
                    'border-b border-border transition-colors last:border-0 hover:bg-surface-muted/70',
                    'data-[selected]:bg-accent-soft data-[selected]:shadow-[inset_3px_0_0_rgb(var(--primary))]',
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((column) => {
                    const Cell = column.rowHeader ? 'th' : 'td';
                    return (
                      <Cell
                        key={column.id}
                        scope={column.rowHeader ? 'row' : undefined}
                        className={clsx(
                          'px-4 py-3.5 align-middle text-[14.5px] font-normal first:pl-6 last:pr-6',
                          ALIGN[column.align ?? 'left'],
                          column.hideOnMobile && 'hidden md:table-cell',
                          column.className,
                        )}
                      >
                        {column.cell(row)}
                      </Cell>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
        {status !== 'loading' && rows.length === 0 && empty}
        {refreshing && (
          <div className="pointer-events-none absolute inset-x-0 top-14 flex justify-center">
            <span className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-[13px] text-muted-foreground shadow-pop">
              <Spinner size={14} /> {t('states.loading')}
            </span>
          </div>
        )}
      </div>
      {footer}
    </div>
  );
}

interface LoadMoreBarProps {
  shown: number;
  total: number;
  hasMore: boolean;
  nextBatchSize: number;
  status: IncrementalStatus;
  error?: unknown;
  onLoadMore: () => void;
  onRetry: () => void;
}

/** Footer for incremental tables: "Showing X of Y" + "Show 20 more" with a downward arrow. */
export function LoadMoreBar({ shown, total, hasMore, nextBatchSize, status, error, onLoadMore, onRetry }: LoadMoreBarProps) {
  const { t } = useTranslation();
  if (status === 'loading' || status === 'error' || total === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 border-t border-border bg-surface-muted/70 px-5 py-3.5 sm:flex-row sm:justify-between">
      <p className="text-[13px] text-muted-foreground" aria-live="polite">
        {hasMore ? t('table.showing', { shown, total }) : t('table.allShown', { total })}
      </p>
      {status === 'loadMoreError' ? (
        <div role="alert" className="flex flex-wrap items-center justify-center gap-3 text-[13px] text-danger">
          <span>{t('table.loadMoreError')} <span className="text-muted-foreground">({t(errorMessageKey(error))})</span></span>
          <Button size="sm" variant="secondary" onClick={onRetry}>
            {t('actions.retry')}
          </Button>
        </div>
      ) : (
        hasMore && (
          <Button
            variant="soft"
            onClick={onLoadMore}
            loading={status === 'loadingMore'}
            iconEnd={<ChevronDown className="h-4 w-4" aria-hidden />}
            className="min-w-[200px]"
          >
            {status === 'loadingMore' ? t('table.loadingMore') : t('table.showMore', { count: nextBatchSize })}
          </Button>
        )
      )}
    </div>
  );
}
