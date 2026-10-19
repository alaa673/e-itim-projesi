import { Archive, CheckCircle2, FileUp, PauseCircle, Pencil, Search, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { type Column, DataTable, LoadMoreBar } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/States';
import { useToast } from '@/components/ui/toastContext';
import { GRADES_BY_LEVEL, IS_MOCK_MODE, SEARCH_DEBOUNCE_MS } from '@/config/constants';
import { useDebounce } from '@/hooks/useDebounce';
import { useIncrementalList } from '@/hooks/useIncrementalList';
import { useLocale } from '@/hooks/useLocale';
import type { RecordStatus, SchoolLevel, Student, StudentListFilters, StudentSortKey } from '@/types';
import { errorMessageKey } from '@/utils/errorHandling';
import { formatDate } from '@/utils/format';
import { StudentFormModal } from '../components/StudentFormModal';
import { studentService } from '../services/studentService';

const STATUS_BADGE: Record<RecordStatus, { tone: 'success' | 'neutral' | 'warning'; icon: typeof CheckCircle2 }> = {
  active: { tone: 'success', icon: CheckCircle2 },
  inactive: { tone: 'neutral', icon: PauseCircle },
  archived: { tone: 'warning', icon: Archive },
};

const INITIAL_FILTERS: StudentListFilters = { search: '', level: '', grade: '', status: '', sortKey: 'name', sortDirection: 'asc' };

export default function StudentsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const { notify } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<StudentListFilters>(INITIAL_FILTERS);
  const debouncedSearch = useDebounce(filters.search, SEARCH_DEBOUNCE_MS);
  const query = useMemo(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch]);
  const list = useIncrementalList<Student>((page, signal) => studentService.list(query, page, signal), (s) => s.id, JSON.stringify(query));

  const [editing, setEditing] = useState<{ student: Student | null } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Student | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  // "Add student" shortcut from the dashboard opens the form directly.
  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      setEditing({ student: null });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const filtersActive = Boolean(filters.search || filters.level || filters.grade || filters.status);
  const update = (patch: Partial<StudentListFilters>) => setFilters((prev) => ({ ...prev, ...patch }));

  const onSortChange = (key: string) =>
    setFilters((prev) => ({
      ...prev,
      sortKey: key as StudentSortKey,
      sortDirection: prev.sortKey === key ? (prev.sortDirection === 'asc' ? 'desc' : 'asc') : key === 'enrolledAt' ? 'desc' : 'asc',
    }));

  const gradeOptions = (filters.level ? GRADES_BY_LEVEL[filters.level] : [...GRADES_BY_LEVEL.primary, ...GRADES_BY_LEVEL.middle, ...GRADES_BY_LEVEL.high]).map(
    (g) => ({ value: String(g), label: t('gradeLabel', { ns: 'common', grade: g }) }),
  );

  const confirmArchive = async () => {
    if (!archiveTarget || archiving) return;
    setArchiving(true);
    setArchiveError(null);
    try {
      const updated = await studentService.archive(archiveTarget.id);
      list.updateItem(updated);
      notify({
        tone: 'success',
        title: t('students.archive.done', { name: `${updated.firstName} ${updated.lastName}` }),
        description: IS_MOCK_MODE ? t('demo.notPersisted', { ns: 'common' }) : undefined,
      });
      setArchiveTarget(null);
    } catch (error) {
      setArchiveError(t(errorMessageKey(error), { ns: 'common' }));
    } finally {
      setArchiving(false);
    }
  };

  const columns: Column<Student>[] = [
    {
      id: 'name',
      header: t('students.columns.student'),
      sortKey: 'name',
      rowHeader: true,
      cell: (s) => (
        <div className="flex min-w-[200px] items-center gap-3">
          <Avatar name={`${s.firstName} ${s.lastName}`} size={34} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {s.firstName} {s.lastName}
            </p>
            <p className="truncate text-[12.5px] text-muted-foreground">{s.email}</p>
          </div>
        </div>
      ),
    },
    { id: 'schoolNumber', header: t('students.columns.schoolNumber'), sortKey: 'schoolNumber', cell: (s) => <span className="tabular-nums">{s.schoolNumber}</span> },
    { id: 'level', header: t('students.columns.level'), hideOnMobile: true, cell: (s) => t(`levels.${s.level}`, { ns: 'common' }) },
    {
      id: 'class',
      header: t('students.columns.class'),
      sortKey: 'grade',
      cell: (s) => <span className="font-semibold tabular-nums">{t('classLabel', { ns: 'common', grade: s.grade, section: s.section })}</span>,
    },
    {
      id: 'status',
      header: t('students.columns.status'),
      cell: (s) => {
        const meta = STATUS_BADGE[s.status];
        const Icon = meta.icon;
        return (
          <Badge tone={meta.tone} icon={<Icon className="h-3.5 w-3.5" aria-hidden />}>
            {t(`status.${s.status}`, { ns: 'common' })}
          </Badge>
        );
      },
    },
    { id: 'enrolledAt', header: t('students.columns.enrolledAt'), sortKey: 'enrolledAt', hideOnMobile: true, cell: (s) => <span className="text-muted-foreground">{formatDate(s.enrolledAt, locale)}</span> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (s) => {
        const name = `${s.firstName} ${s.lastName}`;
        return (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => setEditing({ student: s })}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
              aria-label={`${t('actions.edit', { ns: 'common' })}: ${name}`}
              title={t('actions.edit', { ns: 'common' })}
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => {
                setArchiveError(null);
                setArchiveTarget(s);
              }}
              disabled={s.status === 'archived'}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:pointer-events-none disabled:opacity-30"
              aria-label={`${t('actions.archive', { ns: 'common' })}: ${name}`}
              title={t('actions.archive', { ns: 'common' })}
            >
              <Archive className="h-4 w-4" aria-hidden />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title={t('students.title')}
        description={t('students.description')}
        actions={
          <>
            <Link to="/admin/import" className={buttonClass('secondary')}>
              <FileUp className="h-4 w-4" aria-hidden />
              {t('students.bulkImport')}
            </Link>
            <Button variant="primary" icon={<UserPlus className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ student: null })}>
              {t('students.add')}
            </Button>
          </>
        }
      />

      <div className="panel mb-4 grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,170px))_auto] md:items-end">
        <Input
          type="search"
          label={t('students.filters.search')}
          placeholder={t('students.filters.searchPlaceholder')}
          leading={<Search className="h-4 w-4" aria-hidden />}
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
        />
        <Select
          label={t('students.filters.level')}
          placeholderOption={t('students.filters.allLevels')}
          value={filters.level}
          highlight={Boolean(filters.level)}
          onChange={(e) => update({ level: e.target.value as SchoolLevel | '', grade: '' })}
          options={(['primary', 'middle', 'high'] as const).map((value) => ({ value, label: t(`levels.${value}`, { ns: 'common' }) }))}
        />
        <Select
          label={t('students.filters.grade')}
          placeholderOption={t('students.filters.allGrades')}
          value={filters.grade}
          highlight={Boolean(filters.grade)}
          onChange={(e) => update({ grade: e.target.value })}
          options={gradeOptions}
        />
        <Select
          label={t('students.filters.status')}
          placeholderOption={t('students.filters.allStatuses')}
          value={filters.status}
          highlight={Boolean(filters.status)}
          onChange={(e) => update({ status: e.target.value as RecordStatus | '' })}
          options={(['active', 'inactive', 'archived'] as const).map((value) => ({ value, label: t(`status.${value}`, { ns: 'common' }) }))}
        />
        <Button variant="ghost" onClick={() => setFilters(INITIAL_FILTERS)} disabled={!filtersActive} icon={<X className="h-4 w-4" aria-hidden />}>
          {t('actions.clearFilters', { ns: 'common' })}
        </Button>
      </div>

      <DataTable
        caption={t('students.title')}
        columns={columns}
        rows={list.items}
        getRowId={(s) => s.id}
        status={list.status}
        error={list.error}
        onRetry={list.retry}
        sort={{ key: filters.sortKey, direction: filters.sortDirection }}
        onSortChange={onSortChange}
        rowClassName={(s) => (s.status === 'archived' ? 'opacity-70' : undefined)}
        selectedRowId={editing?.student?.id ?? archiveTarget?.id ?? null}
        empty={
          filtersActive ? (
            <EmptyState
              title={t('states.noResults', { ns: 'common' })}
              description={t('states.noResultsHint', { ns: 'common' })}
              action={
                <Button variant="secondary" size="sm" onClick={() => setFilters(INITIAL_FILTERS)}>
                  {t('actions.clearFilters', { ns: 'common' })}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<Users className="h-5 w-5" aria-hidden />}
              title={t('students.empty.title')}
              description={t('students.empty.description')}
              action={
                <Button variant="primary" size="sm" onClick={() => setEditing({ student: null })}>
                  {t('students.add')}
                </Button>
              }
            />
          )
        }
        footer={
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
        }
      />

      <StudentFormModal
        open={editing !== null}
        student={editing?.student ?? null}
        onClose={() => setEditing(null)}
        onSaved={(saved, mode) => {
          setEditing(null);
          if (mode === 'create') list.refresh();
          else list.updateItem(saved);
          notify({
            tone: 'success',
            title: t(mode === 'create' ? 'students.form.created' : 'students.form.updated', { name: `${saved.firstName} ${saved.lastName}` }),
            description: IS_MOCK_MODE ? t('demo.notPersisted', { ns: 'common' }) : undefined,
          });
        }}
      />

      <ConfirmDialog
        open={archiveTarget !== null}
        title={t('students.archive.title')}
        message={t('students.archive.message', { name: archiveTarget ? `${archiveTarget.firstName} ${archiveTarget.lastName}` : '' })}
        confirmLabel={t('actions.archive', { ns: 'common' })}
        onConfirm={() => void confirmArchive()}
        onCancel={() => !archiving && setArchiveTarget(null)}
        busy={archiving}
        error={archiveError}
      />
    </>
  );
}
