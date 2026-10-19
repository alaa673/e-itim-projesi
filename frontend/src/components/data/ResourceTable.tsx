import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { type Column, DataTable, LoadMoreBar } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/States';
import type { IncrementalList } from '@/hooks/useIncrementalList';
import type { SortState } from '@/hooks/useListQuery';

export interface EmptyConfig {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * DataTable + "20 Daha Fazla Göster" footer + the two empty states (no records / no matches).
 */
export function ResourceTable<T extends { id: string }>({
  caption,
  columns,
  list,
  filtersActive,
  onClearFilters,
  sort,
  onSortChange,
  empty,
  selectedRowId,
  rowClassName,
  className,
}: {
  caption: string;
  columns: Column<T>[];
  list: IncrementalList<T>;
  filtersActive?: boolean;
  onClearFilters?: () => void;
  sort?: SortState;
  onSortChange?: (key: string) => void;
  empty: EmptyConfig;
  selectedRowId?: string | null;
  rowClassName?: (row: T) => string | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <DataTable
      className={className}
      caption={caption}
      columns={columns}
      rows={list.items}
      getRowId={(row) => row.id}
      status={list.status}
      error={list.error}
      onRetry={list.retry}
      sort={sort}
      onSortChange={onSortChange}
      selectedRowId={selectedRowId}
      rowClassName={rowClassName}
      empty={
        filtersActive ? (
          <EmptyState
            title={t('states.noResults')}
            description={t('states.noResultsHint')}
            action={
              onClearFilters && (
                <Button variant="secondary" size="sm" onClick={onClearFilters}>
                  {t('actions.clearFilters')}
                </Button>
              )
            }
          />
        ) : (
          <EmptyState icon={empty.icon} title={empty.title} description={empty.description} action={empty.action} />
        )
      }
      footer={<ListFooter list={list} />}
    />
  );
}

/** The incremental footer on its own (for card grids and custom lists). */
export function ListFooter<T>({ list }: { list: IncrementalList<T> }) {
  return (
    <LoadMoreBar
      shown={list.items.length}
      total={list.total}
      hasMore={list.hasMore}
      nextBatchSize={list.nextBatchSize}
      status={list.status}
      error={list.error}
      onLoadMore={list.loadMore}
      onRetry={list.retry}
    />
  );
}
