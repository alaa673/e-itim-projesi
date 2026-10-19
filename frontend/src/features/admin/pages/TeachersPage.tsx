import { CheckCircle2, FileUp, PauseCircle, Pencil, Power, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { FormModal } from '@/components/form/FormModal';
import { email, required } from '@/components/form/validation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Column } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/IconButton';
import { useAction } from '@/hooks/useAction';
import { useListQuery } from '@/hooks/useListQuery';
import { useLocale } from '@/hooks/useLocale';
import { useStateFlag } from '@/hooks/useOpenParam';
import { useResourceList } from '@/hooks/useResourceList';
import type { Teacher } from '@/types';
import { formatDate } from '@/utils/format';
import { type TeacherInput, teacherApi } from '../services/adminApi';
import { BRANCHES } from '@/config/catalog';

const schema = z.object({
  firstName: required(),
  lastName: required(),
  email: email(),
  phone: z.string().trim().regex(/^[0-9 +()-]{0,20}$/, 'validation.phone'),
  branch: required(),
  status: z.enum(['active', 'inactive']),
});

export default function TeachersPage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const lq = useListQuery<'branch' | 'status'>({ sort: { key: 'name', direction: 'asc' }, descFirst: ['joinedAt'] });
  const list = useResourceList(teacherApi.list, lq.query);
  const [editing, setEditing] = useState<{ teacher: Teacher | null } | null>(null);
  const [toggling, setToggling] = useState<Teacher | null>(null);
  const { run, busy } = useAction();
  useStateFlag('openCreate', () => setEditing({ teacher: null }));

  const name = (x: Teacher) => `${x.firstName} ${x.lastName}`;

  const columns: Column<Teacher>[] = [
    {
      id: 'name',
      header: t('common.fullName', { ns: 'common' }),
      sortKey: 'name',
      rowHeader: true,
      cell: (x) => (
        <span className="flex min-w-[220px] items-center gap-3">
          <Avatar name={name(x)} size={36} />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-foreground">{name(x)}</span>
            <span className="block truncate text-[12.5px] text-muted-foreground">{x.email}</span>
          </span>
        </span>
      ),
    },
    { id: 'branch', header: t('common.branch', { ns: 'common' }), sortKey: 'branch', cell: (x) => x.branch },
    { id: 'classes', header: t('teachers.classes'), hideOnMobile: true, cell: (x) => (x.classIds.length ? t('teachers.classCount', { count: x.classIds.length }) : <span className="text-muted-foreground">—</span>) },
    { id: 'phone', header: t('common.phone', { ns: 'common' }), hideOnMobile: true, cell: (x) => <span className="tabular-nums text-muted-foreground">{x.phone || '—'}</span> },
    {
      id: 'status',
      header: t('common.status', { ns: 'common' }),
      cell: (x) =>
        x.status === 'active' ? (
          <Badge tone="success" dot>
            {t('status.active', { ns: 'common' })}
          </Badge>
        ) : (
          <Badge tone="neutral" icon={<PauseCircle className="h-3.5 w-3.5" aria-hidden />}>
            {t('status.inactive', { ns: 'common' })}
          </Badge>
        ),
    },
    { id: 'joinedAt', header: t('teachers.joinedAt'), sortKey: 'joinedAt', hideOnMobile: true, cell: (x) => <span className="text-muted-foreground">{formatDate(x.joinedAt, locale)}</span> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (x) => (
        <span className="flex justify-end gap-1">
          <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${name(x)}`} onClick={() => setEditing({ teacher: x })} />
          <IconButton
            icon={x.status === 'active' ? Power : CheckCircle2}
            tone={x.status === 'active' ? 'danger' : 'accent'}
            label={`${t(x.status === 'active' ? 'actions.deactivate' : 'actions.activate', { ns: 'common' })}: ${name(x)}`}
            onClick={() => setToggling(x)}
          />
        </span>
      ),
    },
  ];

  const branchOptions = BRANCHES.map((b) => ({ value: b, label: b }));

  return (
    <>
      <PageHeader
        title={t('teachers.title')}
        description={t('teachers.description')}
        actions={
          <>
            <Link to="/admin/import" state={{ kind: 'teachers' }} className={buttonClass('secondary')}>
              <FileUp className="h-4 w-4" aria-hidden />
              {t('teachers.bulk')}
            </Link>
            <Button icon={<UserPlus className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ teacher: null })}>
              {t('teachers.add')}
            </Button>
          </>
        }
      />

      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('teachers.searchPlaceholder')}
        filters={[
          { key: 'branch', label: t('common.branch', { ns: 'common' }), value: lq.filters.branch ?? '', options: branchOptions, allLabel: t('teachers.allBranches') },
          {
            key: 'status',
            label: t('common.status', { ns: 'common' }),
            value: lq.filters.status ?? '',
            options: (['active', 'inactive'] as const).map((s) => ({ value: s, label: t(`status.${s}`, { ns: 'common' }) })),
            allLabel: t('common.allStatuses', { ns: 'common' }),
          },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'branch' | 'status', v)}
        onClear={lq.clear}
      />

      <ResourceTable
        caption={t('teachers.title')}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={editing?.teacher?.id ?? toggling?.id ?? null}
        rowClassName={(x) => (x.status === 'inactive' ? 'opacity-70' : undefined)}
        empty={{
          icon: <Users className="h-5 w-5" aria-hidden />,
          title: t('teachers.empty'),
          action: (
            <Button size="sm" onClick={() => setEditing({ teacher: null })}>
              {t('teachers.add')}
            </Button>
          ),
        }}
      />

      <FormModal<TeacherInput>
        open={editing !== null}
        title={editing?.teacher ? t('teachers.editTitle', { name: name(editing.teacher) }) : t('teachers.add')}
        description={editing?.teacher ? undefined : t('teachers.formHint')}
        schema={schema}
        defaultValues={
          editing?.teacher
            ? { firstName: editing.teacher.firstName, lastName: editing.teacher.lastName, email: editing.teacher.email, phone: editing.teacher.phone, branch: editing.teacher.branch, status: editing.teacher.status }
            : { firstName: '', lastName: '', email: '', phone: '', branch: '', status: 'active' }
        }
        fields={[
          { name: 'firstName', label: t('common.firstName', { ns: 'common' }), autoComplete: 'off' },
          { name: 'lastName', label: t('common.lastName', { ns: 'common' }), autoComplete: 'off' },
          { name: 'email', label: t('common.email', { ns: 'common' }), type: 'email', autoComplete: 'off' },
          { name: 'phone', label: `${t('common.phone', { ns: 'common' })} (${t('common.optional', { ns: 'common' })})`, placeholder: '05xx xxx xx xx' },
          { name: 'branch', label: t('common.branch', { ns: 'common' }), type: 'select', options: branchOptions, placeholderOption: t('common.selectPlaceholder', { ns: 'common' }) },
          {
            name: 'status',
            label: t('common.status', { ns: 'common' }),
            type: 'select',
            options: (['active', 'inactive'] as const).map((s) => ({ value: s, label: t(`status.${s}`, { ns: 'common' }) })),
          },
        ]}
        submitLabel={editing?.teacher ? t('actions.saveChanges', { ns: 'common' }) : t('teachers.add')}
        onClose={() => setEditing(null)}
        onSubmit={async (values) => {
          const current = editing?.teacher;
          const saved = current ? await teacherApi.update(current.id, values) : await teacherApi.create(values);
          setEditing(null);
          if (current) list.updateItem(saved);
          else list.refresh();
          await run(async () => saved, { success: t(current ? 'teachers.updated' : 'teachers.created', { name: name(saved) }) });
        }}
      />

      <ConfirmDialog
        open={toggling !== null}
        tone={toggling?.status === 'active' ? 'danger' : 'primary'}
        title={t(toggling?.status === 'active' ? 'teachers.deactivateTitle' : 'teachers.activateTitle')}
        message={t(toggling?.status === 'active' ? 'teachers.deactivateMessage' : 'teachers.activateMessage', { name: toggling ? name(toggling) : '' })}
        confirmLabel={t(toggling?.status === 'active' ? 'actions.deactivate' : 'actions.activate', { ns: 'common' })}
        busy={busy}
        onCancel={() => setToggling(null)}
        onConfirm={async () => {
          if (!toggling) return;
          const next = toggling.status === 'active' ? 'inactive' : 'active';
          const saved = await run(() => teacherApi.update(toggling.id, { status: next }), {
            success: t(next === 'inactive' ? 'teachers.deactivated' : 'teachers.activated', { name: name(toggling) }),
          });
          if (saved) list.updateItem(saved);
          setToggling(null);
        }}
      />
    </>
  );
}
