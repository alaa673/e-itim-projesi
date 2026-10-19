import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';

export interface FilterDef {
  key: string;
  label: string;
  value: string;
  options: SelectOption[];
  /** Label of the empty option, e.g. "Tüm kademeler". */
  allLabel: string;
}

/** Search + select filters + clear, in one card above a table. Applied filters are highlighted. */
export function FilterBar({
  search,
  onSearch,
  searchLabel,
  searchPlaceholder,
  filters = [],
  onFilter,
  onClear,
  extra,
}: {
  search: string;
  onSearch: (value: string) => void;
  searchLabel: string;
  searchPlaceholder?: string;
  filters?: FilterDef[];
  onFilter?: (key: string, value: string) => void;
  onClear?: () => void;
  extra?: ReactNode;
}) {
  const { t } = useTranslation();
  const active = Boolean(search) || filters.some((f) => f.value);
  return (
    <div className="panel mb-4 flex flex-col gap-3 p-4 md:flex-row md:flex-wrap md:items-end">
      <Input
        type="search"
        containerClassName="min-w-[220px] flex-1"
        label={searchLabel}
        placeholder={searchPlaceholder}
        leading={<Search className="h-4 w-4" aria-hidden />}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      {filters.map((f) => (
        <Select
          key={f.key}
          containerClassName="md:w-[190px]"
          label={f.label}
          value={f.value}
          highlight={Boolean(f.value)}
          placeholderOption={f.allLabel}
          options={f.options}
          onChange={(e) => onFilter?.(f.key, e.target.value)}
        />
      ))}
      {extra}
      {onClear && (
        <Button variant="ghost" onClick={onClear} disabled={!active} icon={<X className="h-4 w-4" aria-hidden />}>
          {t('actions.clearFilters')}
        </Button>
      )}
    </div>
  );
}
