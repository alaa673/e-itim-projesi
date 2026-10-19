import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight, Eye, MessageSquare, Minus, Send, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { Meter } from '@/components/charts/Meter';
import { scoreTone } from '@/components/charts/scoreTone';
import { TopicBars } from '@/components/charts/TopicBars';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import type { Column } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { TOPIC_REVIEW_THRESHOLD } from '@/config/constants';
import { useListQuery } from '@/hooks/useListQuery';
import { useLocale } from '@/hooks/useLocale';
import { useResourceList } from '@/hooks/useResourceList';
import { formatDate, formatPercent } from '@/utils/format';
import { type SupportTarget, SupportExerciseModal } from '../components/SupportExerciseModal';
import { studentInsightApi, type TeacherStudentRow } from '../services/teacherApi';
import { useTeachingScope } from '../hooks/useTeachingScope';

export const SUPPORT_TONE = { none: 'neutral', pending: 'warning', completed: 'success' } as const;

export function Trend({ value }: { value: number }) {
  const { t } = useTranslation('teacher');
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span className={clsx('inline-flex items-center gap-0.5 text-[13px] font-semibold tabular-nums', value > 0 ? 'text-success' : value < 0 ? 'text-danger' : 'text-muted-foreground')}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">{value > 0 ? t('students.up') : value < 0 ? t('students.down') : t('students.same')}</span>
      {Math.abs(value)}
    </span>
  );
}

export default function MyStudentsPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const locale = useLocale();
  const [params] = useSearchParams();
  const lq = useListQuery<'className' | 'needsSupport' | 'support'>({ sort: { key: 'name', direction: 'asc' }, filters: { className: params.get('class') ?? '' } });
  const list = useResourceList(studentInsightApi.list, lq.query);
  const scope = useTeachingScope();
  const [detail, setDetail] = useState<TeacherStudentRow | null>(null);
  const [support, setSupport] = useState<SupportTarget | null>(null);

  const openSupport = (s: TeacherStudentRow) =>
    setSupport({
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      topics: s.topics.map((tp) => ({ id: tp.name, name: tp.name, percent: tp.percent })),
      initialTopicId: s.weakTopic?.name ?? s.topics[0]?.name ?? '',
    });

  const columns: Column<TeacherStudentRow>[] = [
    {
      id: 'name',
      header: t('common.student', { ns: 'common' }),
      sortKey: 'name',
      rowHeader: true,
      cell: (s) => (
        <span className="flex min-w-[200px] items-center gap-3">
          <Avatar name={s.name} size={36} />
          <span>
            <span className="block font-semibold text-foreground">{s.name}</span>
            <span className="block text-[12.5px] font-normal tabular-nums text-muted-foreground">{s.schoolNumber}</span>
          </span>
        </span>
      ),
    },
    { id: 'className', header: t('common.class', { ns: 'common' }), sortKey: 'className', cell: (s) => <span className="font-semibold">{s.className}</span> },
    {
      id: 'average',
      header: t('students.average'),
      sortKey: 'average',
      cell: (s) => (
        <span className="flex min-w-[140px] items-center gap-2.5">
          <Meter className="w-20" value={s.average} tone="score" label={`${s.name} ${t('students.average')}`} />
          <span className={clsx('text-[13.5px] font-semibold tabular-nums', scoreTone(s.average) === 'danger' ? 'text-danger' : 'text-foreground')}>{formatPercent(s.average, locale)}</span>
        </span>
      ),
    },
    { id: 'trend', header: t('students.trend'), hideOnMobile: true, cell: (s) => <Trend value={s.trend} /> },
    {
      id: 'weak',
      header: t('students.weakTopic'),
      hideOnMobile: true,
      cell: (s) => (s.weakTopic ? <Badge tone={s.weakTopic.percent < TOPIC_REVIEW_THRESHOLD ? 'danger' : 'neutral'}>{s.weakTopic.name} · {formatPercent(s.weakTopic.percent, locale)}</Badge> : '—'),
    },
    { id: 'support', header: t('students.support'), hideOnMobile: true, cell: (s) => <Badge tone={SUPPORT_TONE[s.support]} dot={s.support !== 'none'}>{t(`students.supportStatus.${s.support}`)}</Badge> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (s) => (
        <span className="flex justify-end gap-1">
          <IconButton icon={Eye} label={`${t('actions.details', { ns: 'common' })}: ${s.name}`} onClick={() => setDetail(s)} />
          <IconButton icon={Send} tone="accent" label={`${t('dashboard.needsSupport.send')}: ${s.name}`} onClick={() => openSupport(s)} />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t('nav.teacher.myStudents', { ns: 'common' })} description={t('students.description')} />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('students.searchPlaceholder')}
        filters={[
          { key: 'className', label: t('common.class', { ns: 'common' }), value: lq.filters.className ?? '', allLabel: t('common.allClasses', { ns: 'common' }), options: scope.classNames.map((c) => ({ value: c, label: c })) },
          { key: 'support', label: t('students.support'), value: lq.filters.support ?? '', allLabel: t('common.all', { ns: 'common' }), options: (['none', 'pending', 'completed'] as const).map((v) => ({ value: v, label: t(`students.supportStatus.${v}`) })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'className' | 'support', v)}
        onClear={lq.clear}
        extra={
          <label className="flex h-11 items-center gap-2 text-[14px] text-foreground">
            <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--primary))]" checked={lq.filters.needsSupport === 'yes'} onChange={(e) => lq.setFilter('needsSupport', e.target.checked ? 'yes' : '')} />
            {t('students.onlyNeedsSupport', { value: TOPIC_REVIEW_THRESHOLD })}
          </label>
        }
      />
      <ResourceTable
        caption={t('nav.teacher.myStudents', { ns: 'common' })}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={detail?.id ?? null}
        empty={{ icon: <UsersRound className="h-5 w-5" aria-hidden />, title: t('students.empty') }}
      />

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        variant="side"
        size="lg"
        title={detail?.name ?? ''}
        description={detail ? `${detail.className} · ${detail.schoolNumber}` : undefined}
        footer={
          detail && (
            <>
              <Link to="/teacher/messages" className={buttonClass('secondary')}>
                <MessageSquare className="h-4 w-4" aria-hidden />
                {t('students.message')}
              </Link>
              <Button icon={<Send className="h-4 w-4" aria-hidden />} onClick={() => openSupport(detail)}>
                {t('dashboard.needsSupport.send')}
              </Button>
            </>
          )
        }
      >
        {detail && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('students.average'), value: formatPercent(detail.average, locale) },
                { label: t('students.lastScore'), value: detail.lastScore === null ? '—' : formatPercent(detail.lastScore, locale) },
                { label: t('students.trend'), value: <Trend value={detail.trend} /> },
              ].map((x) => (
                <div key={x.label} className="rounded-[14px] bg-surface-muted px-3 py-3 text-center">
                  <p className="text-[12.5px] text-muted-foreground">{x.label}</p>
                  <p className="mt-1 font-display text-[20px] font-extrabold text-foreground">{x.value}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-6 font-display text-[16px] font-extrabold text-foreground">{t('students.topics')}</h3>
            <div className="mt-3">
              <TopicBars
                data={[...detail.topics].sort((a, b) => a.percent - b.percent).map((tp) => ({ id: tp.name, label: tp.name, percent: tp.percent }))}
                threshold={TOPIC_REVIEW_THRESHOLD}
                thresholdLabel={t('classes.threshold', { value: TOPIC_REVIEW_THRESHOLD })}
                reviewLabel={t('classes.review')}
              />
            </div>
            <h3 className="mt-6 font-display text-[16px] font-extrabold text-foreground">{t('students.recent')}</h3>
            <ul className="mt-3 divide-y divide-border rounded-[14px] border border-border">
              {detail.recent.map((r) => (
                <li key={r.title + r.date} className="flex items-center justify-between px-4 py-2.5 text-[14px]">
                  <span>
                    <span className="block font-semibold text-foreground">{r.title}</span>
                    <span className="block text-[12.5px] text-muted-foreground">{formatDate(r.date, locale)}</span>
                  </span>
                  <span className="tabular-nums font-semibold">{formatPercent(r.score, locale)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] text-muted-foreground">
              {t('students.supportLabel')}: <Badge tone={SUPPORT_TONE[detail.support]}>{t(`students.supportStatus.${detail.support}`)}</Badge>
            </p>
          </>
        )}
      </Modal>
      <SupportExerciseModal
        target={support}
        onClose={() => {
          setSupport(null);
          list.refreshSilently();
        }}
      />
    </>
  );
}
