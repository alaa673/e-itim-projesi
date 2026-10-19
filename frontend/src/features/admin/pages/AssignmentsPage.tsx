import { CircleDashed, Link2, Pencil, UserMinus, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Column } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { useResourceList } from '@/hooks/useResourceList';
import type { TeacherAssignment } from '@/types';
import { assignmentApi, assignTeacher, lookupApi } from '../services/adminApi';

/** Which teacher branch can teach a subject (primary-school classes may also use class teachers). */
const BRANCH_FOR: Record<string, string> = { 'T.C. İnkılap Tarihi ve Atatürkçülük': 'Sosyal Bilgiler' };

export default function AssignmentsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const lq = useListQuery<'level' | 'subjectName' | 'status'>({ sort: { key: 'className', direction: 'asc' } });
  const list = useResourceList(assignmentApi.list, lq.query);
  const teachers = useAsync((s) => lookupApi.teachers(s), []);
  const subjects = useAsync((s) => lookupApi.subjects(s), []);
  const [target, setTarget] = useState<TeacherAssignment | null>(null);
  const [teacherId, setTeacherId] = useState('');
  const [showAll, setShowAll] = useState(false);
  const { run, busy } = useAction();

  const candidates = useMemo(() => {
    if (!target) return [];
    const branch = BRANCH_FOR[target.subjectName] ?? target.subjectName;
    return (teachers.data ?? [])
      .filter((x) => showAll || x.branch === branch || (x.branch === 'Sınıf Öğretmenliği' && Number(target.className.split('-')[0]) <= 4))
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'tr'));
  }, [target, teachers.data, showAll]);

  const open = (a: TeacherAssignment) => {
    setTarget(a);
    setTeacherId(a.teacherId ?? '');
    setShowAll(false);
  };

  const save = async (id: string | null) => {
    if (!target) return;
    const saved = await run(() => assignTeacher(target.id, id), {
      success: id ? t('assignments.assigned', { cls: target.className, subject: target.subjectName }) : t('assignments.unassigned', { cls: target.className, subject: target.subjectName }),
    });
    if (saved) {
      list.updateItem(saved);
      setTarget(null);
    }
  };

  const columns: Column<TeacherAssignment>[] = [
    { id: 'className', header: t('common.class', { ns: 'common' }), sortKey: 'className', rowHeader: true, cell: (a) => <span className="font-display text-[15.5px] font-extrabold text-foreground">{a.className}</span> },
    { id: 'subjectName', header: t('common.subject', { ns: 'common' }), sortKey: 'subjectName', cell: (a) => a.subjectName },
    {
      id: 'teacherName',
      header: t('common.teacher', { ns: 'common' }),
      sortKey: 'teacherName',
      cell: (a) =>
        a.teacherName ? (
          <span className="flex items-center gap-2.5">
            <Avatar name={a.teacherName} size={30} />
            {a.teacherName}
          </span>
        ) : (
          <span className="text-muted-foreground">{t('assignments.noTeacher')}</span>
        ),
    },
    { id: 'hours', header: t('assignments.hours'), hideOnMobile: true, align: 'center', cell: (a) => <span className="tabular-nums">{a.weeklyHours}</span> },
    {
      id: 'status',
      header: t('common.status', { ns: 'common' }),
      cell: (a) =>
        a.status === 'assigned' ? (
          <Badge tone="success" dot>
            {t('assignments.status.assigned')}
          </Badge>
        ) : (
          <Badge tone="warning" icon={<CircleDashed className="h-3.5 w-3.5" aria-hidden />}>
            {t('assignments.status.pending')}
          </Badge>
        ),
    },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (a) =>
        a.teacherId ? (
          <IconButton icon={Pencil} label={`${t('assignments.change')}: ${a.className} ${a.subjectName}`} onClick={() => open(a)} />
        ) : (
          <Button size="sm" variant="soft" icon={<UserPlus className="h-4 w-4" aria-hidden />} onClick={() => open(a)} aria-label={`${t('actions.assign', { ns: 'common' })}: ${a.className} ${a.subjectName}`}>
            {t('actions.assign', { ns: 'common' })}
          </Button>
        ),
    },
  ];

  return (
    <>
      <PageHeader title={t('assignments.title')} description={t('assignments.description')} />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('assignments.searchPlaceholder')}
        filters={[
          { key: 'level', label: t('common.level', { ns: 'common' }), value: lq.filters.level ?? '', allLabel: t('common.allLevels', { ns: 'common' }), options: (['primary', 'middle', 'high'] as const).map((v) => ({ value: v, label: t(`levels.${v}`, { ns: 'common' }) })) },
          {
            key: 'subjectName',
            label: t('common.subject', { ns: 'common' }),
            value: lq.filters.subjectName ?? '',
            allLabel: t('common.allSubjects', { ns: 'common' }),
            options: (subjects.data ?? []).map((s) => ({ value: s.name, label: s.name })),
          },
          {
            key: 'status',
            label: t('common.status', { ns: 'common' }),
            value: lq.filters.status ?? '',
            allLabel: t('common.allStatuses', { ns: 'common' }),
            options: (['assigned', 'pending'] as const).map((v) => ({ value: v, label: t(`assignments.status.${v}`) })),
          },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'level' | 'subjectName' | 'status', v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('assignments.title')}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={target?.id ?? null}
        empty={{ icon: <Link2 className="h-5 w-5" aria-hidden />, title: t('assignments.empty') }}
      />

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        size="sm"
        preventClose={busy}
        title={target ? t('assignments.modalTitle', { cls: target.className, subject: target.subjectName }) : ''}
        description={t('assignments.modalHint')}
        footer={
          <>
            {target?.teacherId && (
              <Button variant="ghost" className="mr-auto text-danger" icon={<UserMinus className="h-4 w-4" aria-hidden />} disabled={busy} onClick={() => void save(null)}>
                {t('assignments.remove')}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button loading={busy} disabled={!teacherId || teacherId === target?.teacherId} onClick={() => void save(teacherId)}>
              {t('actions.assign', { ns: 'common' })}
            </Button>
          </>
        }
      >
        <Select
          label={t('common.teacher', { ns: 'common' })}
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          placeholderOption={t('common.selectPlaceholder', { ns: 'common' })}
          options={candidates.map((x) => ({ value: x.id, label: `${x.firstName} ${x.lastName} · ${x.branch}` }))}
        />
        <label className="mt-3 flex items-center gap-2 text-[13.5px] text-muted-foreground">
          <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--primary))]" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          {t('assignments.showAll')}
        </label>
        {candidates.length === 0 && <p className="mt-2 text-[13px] text-warning">{t('assignments.noCandidates')}</p>}
      </Modal>
    </>
  );
}
