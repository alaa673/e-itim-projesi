import { GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { FormModal } from '@/components/form/FormModal';
import { intInRange, optionalText, required } from '@/components/form/validation';
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
import type { UniversityProgram } from '@/types';
import { formatNumber } from '@/utils/format';
import { type ProgramInput, programApi } from '../services/adminApi';
import { CITIES, SCORE_TYPES } from '@/config/catalog';


const schema = z.object({
  university: required(),
  program: required(),
  faculty: required(),
  city: required(),
  kind: z.enum(['Devlet', 'Vakıf']),
  scoreType: z.enum(['SAY', 'EA', 'SÖZ', 'DİL']),
  baseRank: intInRange(1, 3_000_000),
  baseScore: z.coerce.number({ invalid_type_error: 'validation.number' }).min(100, 'validation.min').max(560, 'validation.max'),
  quota: intInRange(1, 1000),
  conditions: optionalText(),
});
type FormValues = z.infer<typeof schema>;

export default function UniversitiesPage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const lq = useListQuery<'city' | 'kind' | 'scoreType'>({ sort: { key: 'baseRank', direction: 'asc' }, descFirst: ['quota'] });
  const list = useResourceList(programApi.list, lq.query);
  const [editing, setEditing] = useState<{ item: UniversityProgram | null } | null>(null);
  const [deleting, setDeleting] = useState<UniversityProgram | null>(null);
  const { run, busy } = useAction();

  const columns: Column<UniversityProgram>[] = [
    {
      id: 'program',
      header: t('universities.program'),
      sortKey: 'program',
      rowHeader: true,
      cell: (p) => (
        <span className="block min-w-[240px]">
          <span className="block font-semibold text-foreground">{p.program}</span>
          <span className="block text-[12.5px] font-normal text-muted-foreground">
            {p.university} · {p.city}
          </span>
        </span>
      ),
    },
    { id: 'kind', header: t('common.type', { ns: 'common' }), cell: (p) => <Badge tone={p.kind === 'Devlet' ? 'info' : 'achievement'}>{t(`universities.kinds.${p.kind === 'Devlet' ? 'state' : 'foundation'}`)}</Badge> },
    { id: 'scoreType', header: t('universities.scoreType'), cell: (p) => <Badge tone="accent">{p.scoreType}</Badge> },
    { id: 'baseRank', header: t('universities.baseRank'), sortKey: 'baseRank', align: 'right', cell: (p) => <span className="tabular-nums font-semibold">{formatNumber(p.baseRank, locale)}</span> },
    { id: 'baseScore', header: t('universities.baseScore'), align: 'right', hideOnMobile: true, cell: (p) => <span className="tabular-nums">{formatNumber(p.baseScore, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> },
    { id: 'quota', header: t('common.quota', { ns: 'common' }), sortKey: 'quota', align: 'right', hideOnMobile: true, cell: (p) => <span className="tabular-nums">{p.quota}</span> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (p) => (
        <span className="flex justify-end gap-1">
          <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${p.university} ${p.program}`} onClick={() => setEditing({ item: p })} />
          <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${p.university} ${p.program}`} onClick={() => setDeleting(p)} />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('universities.title')}
        description={t('universities.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ item: null })}>
            {t('universities.add')}
          </Button>
        }
      />
      <DemoDataNote />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('universities.searchPlaceholder')}
        filters={[
          { key: 'city', label: t('common.city', { ns: 'common' }), value: lq.filters.city ?? '', allLabel: t('schools.allCities'), options: CITIES.map((c) => ({ value: c, label: c })) },
          { key: 'kind', label: t('common.type', { ns: 'common' }), value: lq.filters.kind ?? '', allLabel: t('common.allTypes', { ns: 'common' }), options: [{ value: 'Devlet', label: t('universities.kinds.state') }, { value: 'Vakıf', label: t('universities.kinds.foundation') }] },
          { key: 'scoreType', label: t('universities.scoreType'), value: lq.filters.scoreType ?? '', allLabel: t('common.all', { ns: 'common' }), options: SCORE_TYPES.map((s) => ({ value: s, label: s })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'city' | 'kind' | 'scoreType', v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('universities.title')}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={editing?.item?.id ?? deleting?.id ?? null}
        empty={{ icon: <GraduationCap className="h-5 w-5" aria-hidden />, title: t('universities.empty') }}
      />

      <FormModal<FormValues>
        open={editing !== null}
        size="lg"
        title={editing?.item ? t('universities.editTitle') : t('universities.add')}
        schema={schema}
        defaultValues={
          editing?.item
            ? { ...editing.item, conditions: editing.item.conditions ?? '' }
            : { university: '', program: '', faculty: '', city: '', kind: 'Devlet', scoreType: 'SAY', baseRank: 100000, baseScore: 300, quota: 60, conditions: '' }
        }
        fields={[
          { name: 'university', label: t('universities.university'), span: 2 },
          { name: 'program', label: t('universities.program') },
          { name: 'faculty', label: t('universities.faculty') },
          { name: 'city', label: t('common.city', { ns: 'common' }), type: 'select', options: CITIES.map((c) => ({ value: c, label: c })), placeholderOption: t('common.selectPlaceholder', { ns: 'common' }) },
          { name: 'kind', label: t('common.type', { ns: 'common' }), type: 'select', options: [{ value: 'Devlet', label: t('universities.kinds.state') }, { value: 'Vakıf', label: t('universities.kinds.foundation') }] },
          { name: 'scoreType', label: t('universities.scoreType'), type: 'select', options: SCORE_TYPES.map((s) => ({ value: s, label: s })) },
          { name: 'quota', label: t('common.quota', { ns: 'common' }), type: 'number', min: 1 },
          { name: 'baseRank', label: t('universities.baseRank'), type: 'number', min: 1 },
          { name: 'baseScore', label: t('universities.baseScore'), type: 'number', step: 0.01 },
          { name: 'conditions', label: `${t('universities.conditions')} (${t('common.optional', { ns: 'common' })})`, type: 'textarea', rows: 2 },
        ]}
        submitLabel={t('actions.save', { ns: 'common' })}
        onClose={() => setEditing(null)}
        onSubmit={async (v) => {
          const input: ProgramInput = { ...v, baseRank: Number(v.baseRank), baseScore: Number(v.baseScore), quota: Number(v.quota), conditions: v.conditions || null };
          const current = editing?.item;
          const saved = current ? await programApi.update(current.id, input) : await programApi.create(input);
          setEditing(null);
          if (current) list.updateItem(saved);
          else list.refresh();
          await run(async () => null, { success: t('universities.saved', { name: `${saved.university} — ${saved.program}` }) });
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('universities.deleteTitle')}
        message={t('universities.deleteMessage', { name: deleting ? `${deleting.university} — ${deleting.program}` : '' })}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await run(async () => {
            await programApi.remove(deleting.id);
            return true;
          }, { success: t('universities.deleted') });
          setDeleting(null);
          if (ok) list.refresh();
        }}
      />
    </>
  );
}
