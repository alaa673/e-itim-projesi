import { Briefcase, Pencil, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { ListFooter } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { FormModal } from '@/components/form/FormModal';
import { required } from '@/components/form/validation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useListQuery } from '@/hooks/useListQuery';
import { useResourceList } from '@/hooks/useResourceList';
import type { Career } from '@/types';
import { type CareerInput, careerApi } from '../services/adminApi';
import { CAREER_FIELDS, SCORE_TYPES } from '@/config/catalog';

const FIELDS = CAREER_FIELDS;
const OUTLOOK_TONE = { high: 'success', medium: 'info', low: 'neutral' } as const;
const list = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean);

const schema = z.object({
  name: required(),
  field: required(),
  description: required(),
  skills: required(),
  programs: required(),
  outlook: z.enum(['high', 'medium', 'low']),
  scoreType: z.enum(['SAY', 'EA', 'SÖZ', 'DİL']),
});
type FormValues = z.infer<typeof schema>;

export default function CareersPage() {
  const { t } = useTranslation(['admin', 'common']);
  const lq = useListQuery<'field'>({ sort: { key: 'name', direction: 'asc' } });
  const items = useResourceList(careerApi.list, lq.query);
  const [editing, setEditing] = useState<{ item: Career | null } | null>(null);
  const [deleting, setDeleting] = useState<Career | null>(null);
  const { run, busy } = useAction();

  return (
    <>
      <PageHeader
        title={t('careers.title')}
        description={t('careers.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ item: null })}>
            {t('careers.add')}
          </Button>
        }
      />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('careers.searchPlaceholder')}
        filters={[{ key: 'field', label: t('careers.field'), value: lq.filters.field ?? '', allLabel: t('careers.allFields'), options: FIELDS.map((f) => ({ value: f, label: f })) }]}
        onFilter={(_, v) => lq.setFilter('field', v)}
        onClear={lq.clear}
      />

      {items.status === 'error' ? (
        <div className="panel">
          <ErrorState error={items.error} onRetry={items.retry} />
        </div>
      ) : items.status === 'loading' && items.items.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-panel" />
          ))}
        </div>
      ) : items.items.length === 0 ? (
        <div className="panel">
          <EmptyState icon={<Briefcase className="h-5 w-5" aria-hidden />} title={lq.active ? t('states.noResults', { ns: 'common' }) : t('careers.empty')} />
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <ul className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {items.items.map((c) => (
              <li key={c.id} className="flex flex-col rounded-[18px] border border-border bg-surface p-5">
                <div className="flex items-start gap-3">
                  <span className="icon-tile h-11 w-11 bg-tint-sky text-ink-sky">
                    <Briefcase className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-[17px] font-extrabold text-foreground">{c.name}</h2>
                    <p className="text-[13px] text-muted-foreground">
                      {c.field} · {c.scoreType}
                    </p>
                  </div>
                  <Badge tone={OUTLOOK_TONE[c.outlook]} icon={<TrendingUp className="h-3 w-3" aria-hidden />}>
                    {t(`careers.outlook.${c.outlook}`)}
                  </Badge>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-foreground">{c.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.skills.map((s) => (
                    <span key={s} className="rounded-full bg-surface-muted px-2.5 py-1 text-[12.5px] text-foreground">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[12.5px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{t('careers.programs')}:</span> {c.programs.join(', ')}
                </p>
                <div className="mt-auto flex justify-end gap-1 pt-3">
                  <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${c.name}`} onClick={() => setEditing({ item: c })} />
                  <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${c.name}`} onClick={() => setDeleting(c)} />
                </div>
              </li>
            ))}
          </ul>
          <ListFooter list={items} />
        </div>
      )}

      <FormModal<FormValues>
        open={editing !== null}
        size="lg"
        title={editing?.item ? t('careers.editTitle', { name: editing.item.name }) : t('careers.add')}
        schema={schema}
        defaultValues={
          editing?.item
            ? { ...editing.item, skills: editing.item.skills.join(', '), programs: editing.item.programs.join(', ') }
            : { name: '', field: '', description: '', skills: '', programs: '', outlook: 'medium', scoreType: 'SAY' }
        }
        fields={[
          { name: 'name', label: t('careers.name') },
          { name: 'field', label: t('careers.field'), type: 'select', options: FIELDS.map((f) => ({ value: f, label: f })), placeholderOption: t('common.selectPlaceholder', { ns: 'common' }) },
          { name: 'description', label: t('common.description', { ns: 'common' }), type: 'textarea', rows: 3 },
          { name: 'skills', label: t('careers.skills'), hint: t('careers.commaHint'), span: 2 },
          { name: 'programs', label: t('careers.programs'), hint: t('careers.commaHint'), span: 2 },
          { name: 'outlook', label: t('careers.outlookLabel'), type: 'select', options: (['high', 'medium', 'low'] as const).map((v) => ({ value: v, label: t(`careers.outlook.${v}`) })) },
          { name: 'scoreType', label: t('universities.scoreType'), type: 'select', options: SCORE_TYPES.map((s) => ({ value: s, label: s })) },
        ]}
        submitLabel={t('actions.save', { ns: 'common' })}
        onClose={() => setEditing(null)}
        onSubmit={async (v) => {
          const input: CareerInput = { ...v, skills: list(v.skills), programs: list(v.programs) };
          const current = editing?.item;
          const saved = current ? await careerApi.update(current.id, input) : await careerApi.create(input);
          setEditing(null);
          if (current) items.updateItem(saved);
          else items.refresh();
          await run(async () => null, { success: t('careers.saved', { name: saved.name }) });
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('careers.deleteTitle')}
        message={t('careers.deleteMessage', { name: deleting?.name ?? '' })}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await run(async () => {
            await careerApi.remove(deleting.id);
            return true;
          }, { success: t('careers.deleted', { name: deleting.name }) });
          setDeleting(null);
          if (ok) items.refresh();
        }}
      />
    </>
  );
}
