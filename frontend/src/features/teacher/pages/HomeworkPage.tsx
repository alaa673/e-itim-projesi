import { ClipboardCheck, Lock, NotebookPen, Pencil, Plus, Unlock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Meter } from '@/components/charts/Meter';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { FormModal } from '@/components/form/FormModal';
import { atLeastOne, dateString, required } from '@/components/form/validation';
import { PageHeader } from '@/components/layout/PageHeader';
import { DueLabel } from '@/components/layout/RelativeTime';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import type { Column } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/IconButton';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { useResourceList } from '@/hooks/useResourceList';
import { type Homework, homeworkApi, rosterNames, rubricApi } from '../services/teacherApi';
import { useTeachingScope } from '../hooks/useTeachingScope';

const schema = z
  .object({ title: required(), description: required(), classNames: atLeastOne(), due: dateString(), rubricId: z.string() })
  .refine((v) => new Date(v.due).getTime() > Date.now(), { path: ['due'], message: 'validation.futureDate' });
type FormValues = z.infer<typeof schema>;

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function HomeworkPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const lq = useListQuery<'status'>({ sort: { key: 'due', direction: 'desc' }, descFirst: ['due'] });
  const list = useResourceList(homeworkApi.list, lq.query);
  const rubrics = useAsync((signal) => rubricApi.list({ offset: 0, limit: 100 }, signal), []);
  const scope = useTeachingScope();
  const [editing, setEditing] = useState<{ item: Homework | null } | null>(null);
  const { run } = useAction();

  const rubricName = (id: string | null) => rubrics.data?.items.find((r) => r.id === id)?.title;

  const columns: Column<Homework>[] = [
    {
      id: 'title',
      header: t('homework.title'),
      rowHeader: true,
      cell: (h) => (
        <span className="block min-w-[220px]">
          <span className="block font-semibold text-foreground">{h.title}</span>
          <span className="line-clamp-1 block text-[12.5px] font-normal text-muted-foreground">{h.description}</span>
        </span>
      ),
    },
    { id: 'classes', header: t('common.class', { ns: 'common' }), cell: (h) => <span className="flex flex-wrap gap-1">{h.classNames.map((c) => <Badge key={c}>{c}</Badge>)}</span> },
    { id: 'due', header: t('common.due', { ns: 'common' }), sortKey: 'due', cell: (h) => <span className="whitespace-nowrap"><DueLabel iso={h.due} /></span> },
    {
      id: 'submitted',
      header: t('homework.submissions'),
      cell: (h) => (
        <span className="flex min-w-[140px] items-center gap-2">
          <Meter className="w-16" size="sm" value={h.submitted} max={Math.max(1, h.total)} tone="role" label={`${h.title} ${t('homework.submissions')}`} />
          <span className="text-[12.5px] tabular-nums text-muted-foreground">
            {h.submitted}/{h.total}
          </span>
        </span>
      ),
    },
    { id: 'rubric', header: t('homework.rubric'), hideOnMobile: true, cell: (h) => <span className="text-muted-foreground">{rubricName(h.rubricId) ?? '—'}</span> },
    { id: 'status', header: t('common.status', { ns: 'common' }), cell: (h) => <Badge tone={h.status === 'open' ? 'success' : 'neutral'} dot>{t(`homework.status.${h.status}`)}</Badge> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (h) => (
        <span className="flex justify-end gap-1">
          <Link to={`/teacher/grading?homework=${h.id}`} className={buttonClass('soft', 'sm')} aria-label={`${t('homework.grade')}: ${h.title}`}>
            <ClipboardCheck className="h-4 w-4" aria-hidden />
            {t('homework.grade')}
          </Link>
          <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${h.title}`} onClick={() => setEditing({ item: h })} />
          <IconButton
            icon={h.status === 'open' ? Lock : Unlock}
            label={`${t(h.status === 'open' ? 'homework.close' : 'homework.reopen')}: ${h.title}`}
            onClick={async () => {
              const saved = await run(() => homeworkApi.update(h.id, { status: h.status === 'open' ? 'closed' : 'open' }), { success: t(h.status === 'open' ? 'homework.closed' : 'homework.reopened') });
              if (saved) list.updateItem(saved);
            }}
          />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('nav.teacher.assignments', { ns: 'common' })}
        description={t('homework.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ item: null })}>
            {t('homework.add')}
          </Button>
        }
      />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('homework.searchPlaceholder')}
        filters={[{ key: 'status', label: t('common.status', { ns: 'common' }), value: lq.filters.status ?? '', allLabel: t('common.allStatuses', { ns: 'common' }), options: (['open', 'closed'] as const).map((v) => ({ value: v, label: t(`homework.status.${v}`) })) }]}
        onFilter={(_, v) => lq.setFilter('status', v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('nav.teacher.assignments', { ns: 'common' })}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={editing?.item?.id ?? null}
        empty={{ icon: <NotebookPen className="h-5 w-5" aria-hidden />, title: t('homework.empty') }}
      />
      <FormModal<FormValues>
        open={editing !== null}
        size="lg"
        title={editing?.item ? t('homework.editTitle') : t('homework.add')}
        schema={schema}
        defaultValues={
          editing?.item
            ? { title: editing.item.title, description: editing.item.description, classNames: editing.item.classNames, due: toLocalInput(editing.item.due), rubricId: editing.item.rubricId ?? '' }
            : { title: '', description: '', classNames: [], due: toLocalInput(new Date(Date.now() + 3 * 86_400_000).toISOString().replace(/T.*/, 'T23:59:00')), rubricId: '' }
        }
        fields={[
          { name: 'title', label: t('homework.title'), span: 2 },
          { name: 'description', label: t('homework.instructions'), type: 'textarea', rows: 4 },
          { name: 'classNames', label: t('exams.classes'), type: 'checkboxes', options: scope.classNames.map((c) => ({ value: c, label: c })) },
          { name: 'due', label: t('common.due', { ns: 'common' }), type: 'datetime-local' },
          { name: 'rubricId', label: t('homework.rubric'), type: 'select', placeholderOption: t('homework.noRubric'), options: (rubrics.data?.items ?? []).map((r) => ({ value: r.id, label: r.title })) },
        ]}
        submitLabel={editing?.item ? t('actions.saveChanges', { ns: 'common' }) : t('homework.assign')}
        onClose={() => setEditing(null)}
        onSubmit={async (v) => {
          const current = editing?.item;
          const rosters = await Promise.all(v.classNames.map(rosterNames));
          const input = { title: v.title, description: v.description, classNames: v.classNames, due: new Date(v.due).toISOString(), rubricId: v.rubricId || null, total: rosters.reduce((n, r) => n + r.length, 0), status: current?.status ?? ('open' as const) };
          const saved = current ? await homeworkApi.update(current.id, input) : await homeworkApi.create(input);
          setEditing(null);
          if (current) list.updateItem(saved);
          else list.refresh();
          await run(async () => null, { success: t(current ? 'homework.updated' : 'homework.assigned', { classes: v.classNames.join(', ') }) });
        }}
      />
    </>
  );
}
