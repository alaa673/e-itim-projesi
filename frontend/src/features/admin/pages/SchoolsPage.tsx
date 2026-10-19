import { Pencil, Plus, School, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { FormModal } from '@/components/form/FormModal';
import { intInRange, required } from '@/components/form/validation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Column } from '@/components/ui/DataTable';
import { DemoDataNote } from '@/components/ui/DemoDataNote';
import { IconButton } from '@/components/ui/IconButton';
import { useAction } from '@/hooks/useAction';
import { useListQuery } from '@/hooks/useListQuery';
import { useLocale } from '@/hooks/useLocale';
import { useResourceList } from '@/hooks/useResourceList';
import type { HighSchool } from '@/types';
import { formatNumber } from '@/utils/format';
import { schoolApi } from '../services/adminApi';
import { CITIES, SCHOOL_TYPES } from '@/config/catalog';


const scoreSchema = z.coerce.number({ invalid_type_error: 'validation.number' }).min(0, 'validation.min').max(500, 'validation.max');
const schema = z.object({
  name: required(),
  city: required(),
  district: required(),
  type: required(),
  language: required(),
  quota: intInRange(1, 2000),
  baseScore: scoreSchema,
  percentile: z.coerce.number({ invalid_type_error: 'validation.number' }).min(0, 'validation.min').max(100, 'validation.max'),
});
type FormValues = z.infer<typeof schema>;

export default function SchoolsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const lq = useListQuery<'city' | 'type'>({ sort: { key: 'score', direction: 'desc' }, descFirst: ['score', 'quota'] });
  const list = useResourceList(schoolApi.list, lq.query);
  const [editing, setEditing] = useState<{ school: HighSchool | null } | null>(null);
  const [deleting, setDeleting] = useState<HighSchool | null>(null);
  const { run, busy } = useAction();
  const year = new Date().getFullYear() - 1;

  const latest = (s: HighSchool) => s.scores.at(-1);

  const columns: Column<HighSchool>[] = [
    {
      id: 'name',
      header: t('schools.school'),
      sortKey: 'name',
      rowHeader: true,
      cell: (s) => (
        <span className="block min-w-[220px]">
          <span className="block font-semibold text-foreground">{s.name}</span>
          <span className="block text-[12.5px] font-normal text-muted-foreground">
            {s.city} / {s.district}
          </span>
        </span>
      ),
    },
    { id: 'type', header: t('common.type', { ns: 'common' }), hideOnMobile: true, cell: (s) => <Badge tone="accent">{s.type}</Badge> },
    { id: 'language', header: t('schools.language'), hideOnMobile: true, cell: (s) => s.language },
    { id: 'quota', header: t('common.quota', { ns: 'common' }), sortKey: 'quota', align: 'right', cell: (s) => <span className="tabular-nums">{s.quota}</span> },
    {
      id: 'score',
      header: t('schools.baseScore'),
      sortKey: 'score',
      align: 'right',
      cell: (s) => {
        const l = latest(s);
        return l ? (
          <span className="block tabular-nums">
            <span className="font-semibold text-foreground">{formatNumber(l.baseScore, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="block text-[12px] text-muted-foreground">{t('schools.percentile', { value: formatNumber(l.percentile, locale, { maximumFractionDigits: 2 }) })}</span>
          </span>
        ) : (
          '—'
        );
      },
    },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (s) => (
        <span className="flex justify-end gap-1">
          <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${s.name}`} onClick={() => setEditing({ school: s })} />
          <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${s.name}`} onClick={() => setDeleting(s)} />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('schools.title')}
        description={t('schools.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ school: null })}>
            {t('schools.add')}
          </Button>
        }
      />
      <DemoDataNote />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('schools.searchPlaceholder')}
        filters={[
          { key: 'city', label: t('common.city', { ns: 'common' }), value: lq.filters.city ?? '', allLabel: t('schools.allCities'), options: CITIES.map((c) => ({ value: c, label: c })) },
          { key: 'type', label: t('common.type', { ns: 'common' }), value: lq.filters.type ?? '', allLabel: t('common.allTypes', { ns: 'common' }), options: SCHOOL_TYPES.map((c) => ({ value: c, label: c })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'city' | 'type', v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('schools.title')}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={editing?.school?.id ?? deleting?.id ?? null}
        empty={{ icon: <School className="h-5 w-5" aria-hidden />, title: t('schools.empty') }}
      />

      <FormModal<FormValues>
        open={editing !== null}
        size="lg"
        title={editing?.school ? t('schools.editTitle') : t('schools.add')}
        schema={schema}
        defaultValues={
          editing?.school
            ? { name: editing.school.name, city: editing.school.city, district: editing.school.district, type: editing.school.type, language: editing.school.language, quota: editing.school.quota, baseScore: latest(editing.school)?.baseScore ?? 0, percentile: latest(editing.school)?.percentile ?? 0 }
            : { name: '', city: '', district: '', type: '', language: 'Türkçe', quota: 120, baseScore: 400, percentile: 20 }
        }
        fields={[
          { name: 'name', label: t('schools.school'), span: 2 },
          { name: 'city', label: t('common.city', { ns: 'common' }), type: 'select', options: CITIES.map((c) => ({ value: c, label: c })), placeholderOption: t('common.selectPlaceholder', { ns: 'common' }) },
          { name: 'district', label: t('common.district', { ns: 'common' }) },
          { name: 'type', label: t('common.type', { ns: 'common' }), type: 'select', options: SCHOOL_TYPES.map((c) => ({ value: c, label: c })), placeholderOption: t('common.selectPlaceholder', { ns: 'common' }) },
          { name: 'language', label: t('schools.language'), type: 'select', options: ['Türkçe', 'İngilizce hazırlıklı'].map((c) => ({ value: c, label: c })) },
          { name: 'quota', label: t('common.quota', { ns: 'common' }), type: 'number', min: 1 },
          { name: 'baseScore', label: t('schools.baseScoreYear', { year }), type: 'number', step: 0.01, min: 0, max: 500 },
          { name: 'percentile', label: t('schools.percentileLabel'), type: 'number', step: 0.01, min: 0, max: 100 },
        ]}
        submitLabel={t('actions.save', { ns: 'common' })}
        onClose={() => setEditing(null)}
        onSubmit={async (v) => {
          const current = editing?.school;
          const scores = current ? current.scores.filter((s) => s.year !== year) : [];
          const input = { name: v.name, city: v.city, district: v.district, type: v.type, language: v.language, quota: Number(v.quota), scores: [...scores, { year, baseScore: Number(v.baseScore), percentile: Number(v.percentile) }].sort((a, b) => a.year - b.year) };
          const saved = current ? await schoolApi.update(current.id, input) : await schoolApi.create(input);
          setEditing(null);
          if (current) list.updateItem(saved);
          else list.refresh();
          await run(async () => null, { success: t('schools.saved', { name: saved.name }) });
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('schools.deleteTitle')}
        message={t('schools.deleteMessage', { name: deleting?.name ?? '' })}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await run(async () => {
            await schoolApi.remove(deleting.id);
            return true;
          }, { success: t('schools.deleted', { name: deleting.name }) });
          setDeleting(null);
          if (ok) list.refresh();
        }}
      />
    </>
  );
}
