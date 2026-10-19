import { ArrowRightLeft, Eye, Pencil, Plus, School, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Meter } from '@/components/charts/Meter';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { FormModal } from '@/components/form/FormModal';
import { intInRange, required } from '@/components/form/validation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { Column } from '@/components/ui/DataTable';
import { DetailList } from '@/components/ui/DetailList';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { AsyncContent, Skeleton } from '@/components/ui/States';
import { GRADES_BY_LEVEL, SECTIONS } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { useStateFlag } from '@/hooks/useOpenParam';
import { useResourceList } from '@/hooks/useResourceList';
import type { SchoolClass, SchoolLevel, Student } from '@/types';
import { type ClassInput, classApi, lookupApi, rosterApi } from '../services/adminApi';

const levelOf = (grade: number): SchoolLevel => (grade <= 4 ? 'primary' : grade <= 8 ? 'middle' : 'high');

const schema = z.object({
  level: z.enum(['primary', 'middle', 'high']),
  grade: intInRange(1, 12),
  section: required(),
  homeroomTeacherId: z.string(),
  capacity: intInRange(5, 60),
  room: required(),
});

export default function ClassesPage() {
  const { t } = useTranslation(['admin', 'common']);
  const lq = useListQuery<'level' | 'grade'>({ sort: { key: 'name', direction: 'asc' } });
  const list = useResourceList(classApi.list, lq.query);
  const teachers = useAsync((s) => lookupApi.teachers(s), []);
  const [editing, setEditing] = useState<{ cls: SchoolClass | null } | null>(null);
  const [viewing, setViewing] = useState<SchoolClass | null>(null);
  const { run } = useAction();
  useStateFlag('openCreate', () => setEditing({ cls: null }));

  const teacherOptions = useMemo(
    () => (teachers.data ?? []).map((x) => ({ value: x.id, label: `${x.firstName} ${x.lastName} · ${x.branch}` })).sort((a, b) => a.label.localeCompare(b.label, 'tr')),
    [teachers.data],
  );
  const grades = lq.filters.level ? GRADES_BY_LEVEL[lq.filters.level as SchoolLevel] : [...GRADES_BY_LEVEL.primary, ...GRADES_BY_LEVEL.middle, ...GRADES_BY_LEVEL.high];

  const columns: Column<SchoolClass>[] = [
    {
      id: 'name',
      header: t('common.class', { ns: 'common' }),
      sortKey: 'name',
      rowHeader: true,
      cell: (c) => (
        <span className="flex items-center gap-3">
          <span className="icon-tile h-10 w-10 bg-tint-violet text-ink-violet">
            <UsersRound className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <span className="font-display text-[16px] font-extrabold text-foreground">{c.name}</span>
        </span>
      ),
    },
    { id: 'level', header: t('common.level', { ns: 'common' }), hideOnMobile: true, cell: (c) => t(`levels.${c.level}`, { ns: 'common' }) },
    { id: 'homeroom', header: t('classes.homeroom'), cell: (c) => (c.homeroomTeacher ? <span className="flex items-center gap-2"><Avatar name={c.homeroomTeacher} size={28} />{c.homeroomTeacher}</span> : <span className="text-muted-foreground">{t('classes.noHomeroom')}</span>) },
    {
      id: 'studentCount',
      header: t('classes.fill'),
      sortKey: 'studentCount',
      cell: (c) => (
        <span className="flex min-w-[150px] items-center gap-3">
          <Meter className="w-20" value={c.studentCount} max={c.capacity} tone={c.studentCount > c.capacity ? 'danger' : 'role'} label={`${c.name} ${t('classes.fill')}`} />
          <span className="tabular-nums text-[13.5px] text-foreground">
            {c.studentCount}/{c.capacity}
          </span>
        </span>
      ),
    },
    { id: 'room', header: t('common.room', { ns: 'common' }), hideOnMobile: true, cell: (c) => <span className="tabular-nums text-muted-foreground">{c.room}</span> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (c) => (
        <span className="flex justify-end gap-1">
          <IconButton icon={Eye} label={`${t('classes.viewStudents')}: ${c.name}`} onClick={() => setViewing(c)} />
          <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${c.name}`} onClick={() => setEditing({ cls: c })} />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('classes.title')}
        description={t('classes.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ cls: null })}>
            {t('classes.add')}
          </Button>
        }
      />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('classes.searchPlaceholder')}
        filters={[
          { key: 'level', label: t('common.level', { ns: 'common' }), value: lq.filters.level ?? '', allLabel: t('common.allLevels', { ns: 'common' }), options: (['primary', 'middle', 'high'] as const).map((v) => ({ value: v, label: t(`levels.${v}`, { ns: 'common' }) })) },
          { key: 'grade', label: t('common.grade', { ns: 'common' }), value: lq.filters.grade ?? '', allLabel: t('classes.allGrades'), options: grades.map((g) => ({ value: String(g), label: t('gradeLabel', { ns: 'common', grade: g }) })) },
        ]}
        onFilter={(k, v) => {
          lq.setFilter(k as 'level' | 'grade', v);
          if (k === 'level') lq.setFilter('grade', '');
        }}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('classes.title')}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={viewing?.id ?? editing?.cls?.id ?? null}
        empty={{ icon: <School className="h-5 w-5" aria-hidden />, title: t('classes.empty') }}
      />

      <FormModal<ClassInput>
        open={editing !== null}
        title={editing?.cls ? t('classes.editTitle', { name: editing.cls.name }) : t('classes.add')}
        schema={schema}
        defaultValues={
          editing?.cls
            ? { level: editing.cls.level, grade: editing.cls.grade, section: editing.cls.section, homeroomTeacherId: editing.cls.homeroomTeacherId ?? '', capacity: editing.cls.capacity, room: editing.cls.room }
            : { level: 'middle', grade: 5, section: 'A', homeroomTeacherId: '', capacity: 32, room: '' }
        }
        fields={[
          { name: 'level', label: t('common.level', { ns: 'common' }), type: 'select', options: (['primary', 'middle', 'high'] as const).map((v) => ({ value: v, label: t(`levels.${v}`, { ns: 'common' }) })) },
          { name: 'grade', label: t('common.grade', { ns: 'common' }), type: 'select', options: Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: t('gradeLabel', { ns: 'common', grade: i + 1 }) })) },
          { name: 'section', label: t('common.section', { ns: 'common' }), type: 'select', options: SECTIONS.map((s) => ({ value: s, label: s })) },
          { name: 'room', label: t('common.room', { ns: 'common' }), placeholder: 'B-104' },
          { name: 'homeroomTeacherId', label: t('classes.homeroom'), type: 'select', options: teacherOptions, placeholderOption: t('classes.noHomeroom'), span: 2 },
          { name: 'capacity', label: t('common.capacity', { ns: 'common' }), type: 'number', min: 5, max: 60 },
        ]}
        submitLabel={t('actions.save', { ns: 'common' })}
        onClose={() => setEditing(null)}
        onSubmit={async (values) => {
          const input = { ...values, grade: Number(values.grade), level: levelOf(Number(values.grade)) };
          const current = editing?.cls;
          const teacher = teachers.data?.find((x) => x.id === input.homeroomTeacherId);
          const saved = current ? await classApi.update(current.id, input) : await classApi.create(input);
          const withName = { ...saved, homeroomTeacher: teacher ? `${teacher.firstName} ${teacher.lastName}` : null };
          if (current) list.updateItem(withName);
          else list.refresh();
          setEditing(null);
          await run(async () => null, { success: t('classes.saved', { name: saved.name }) });
        }}
      />

      <ClassDetail cls={viewing} onClose={() => setViewing(null)} onChanged={list.refresh} />
    </>
  );
}

function ClassDetail({ cls, onClose, onChanged }: { cls: SchoolClass | null; onClose: () => void; onChanged: () => void }) {
  const { t } = useTranslation(['admin', 'common']);
  const roster = useAsync((signal) => (cls ? rosterApi.list(cls.name, signal) : Promise.resolve([] as Student[])), [cls?.name]);
  const classes = useAsync((s) => lookupApi.classes(s), []);
  const [moving, setMoving] = useState<Student | null>(null);
  const [target, setTarget] = useState('');
  const { run, busy } = useAction();
  const targets = (classes.data ?? []).filter((c) => cls && c.level === cls.level && c.name !== cls.name);

  return (
    <Modal open={cls !== null} onClose={onClose} variant="side" size="lg" title={cls ? t('classes.detailTitle', { name: cls.name }) : ''} description={cls?.homeroomTeacher ? t('classes.homeroomOf', { name: cls.homeroomTeacher }) : undefined}>
      {cls && (
        <>
          <DetailList
            columns={3}
            items={[
              { label: t('common.level', { ns: 'common' }), value: t(`levels.${cls.level}`, { ns: 'common' }) },
              { label: t('common.room', { ns: 'common' }), value: cls.room },
              { label: t('classes.fill'), value: `${cls.studentCount}/${cls.capacity}` },
            ]}
          />
          <h3 className="mt-6 font-display text-[16px] font-extrabold text-foreground">{t('classes.roster')}</h3>
          <AsyncContent data={roster.data} error={roster.error} loading={roster.loading} reload={roster.reload} skeleton={<Skeleton className="mt-3 h-40 rounded-[14px]" />}>
            {(students) =>
              students.length === 0 ? (
                <p className="mt-3 text-[14px] text-muted-foreground">{t('classes.rosterEmpty')}</p>
              ) : (
                <ul className="mt-3 divide-y divide-border rounded-[14px] border border-border">
                  {students.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Avatar name={`${s.firstName} ${s.lastName}`} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-semibold text-foreground">
                          {s.firstName} {s.lastName}
                        </span>
                        <span className="block text-[12.5px] tabular-nums text-muted-foreground">{s.schoolNumber}</span>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<ArrowRightLeft className="h-4 w-4" aria-hidden />}
                        aria-label={`${t('actions.transfer', { ns: 'common' })}: ${s.firstName} ${s.lastName}`}
                        onClick={() => {
                          setMoving(s);
                          setTarget('');
                        }}
                      >
                        {t('actions.transfer', { ns: 'common' })}
                      </Button>
                    </li>
                  ))}
                </ul>
              )
            }
          </AsyncContent>

          <Modal
            open={moving !== null}
            onClose={() => setMoving(null)}
            size="sm"
            title={t('classes.transferTitle')}
            description={moving ? t('classes.transferHint', { name: `${moving.firstName} ${moving.lastName}`, from: cls.name }) : undefined}
            preventClose={busy}
            footer={
              <>
                <Button variant="secondary" onClick={() => setMoving(null)} disabled={busy}>
                  {t('actions.cancel', { ns: 'common' })}
                </Button>
                <Button
                  disabled={!target}
                  loading={busy}
                  onClick={async () => {
                    const to = targets.find((c) => c.name === target);
                    if (!moving || !to) return;
                    const res = await run(() => rosterApi.transfer(moving.id, { grade: to.grade, section: to.section, level: to.level }), {
                      success: t('classes.transferred', { name: `${moving.firstName} ${moving.lastName}`, to: to.name }),
                    });
                    if (res) {
                      setMoving(null);
                      roster.reload();
                      onChanged();
                    }
                  }}
                >
                  {t('actions.transfer', { ns: 'common' })}
                </Button>
              </>
            }
          >
            <Select
              label={t('classes.targetClass')}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholderOption={t('common.selectPlaceholder', { ns: 'common' })}
              options={targets.map((c) => ({ value: c.name, label: `${c.name} (${c.studentCount}/${c.capacity})` }))}
            />
            <p className="mt-3 text-[13px] text-muted-foreground">{t('classes.transferNote')}</p>
          </Modal>
        </>
      )}
    </Modal>
  );
}
