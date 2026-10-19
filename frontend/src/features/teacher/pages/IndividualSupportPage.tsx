import { ArrowRight, HeartHandshake, Send, TrendingUp, UserCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatTile } from '@/components/dashboard/StatTile';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { DueLabel, RelativeTime } from '@/components/layout/RelativeTime';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { TOPIC_REVIEW_THRESHOLD } from '@/config/constants';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { useLocale } from '@/hooks/useLocale';
import { useResourceList } from '@/hooks/useResourceList';
import { formatPercent } from '@/utils/format';
import { type SupportTarget, SupportExerciseModal } from '../components/SupportExerciseModal';
import { type SentSupport, sentSupportApi, studentInsightApi } from '../services/teacherApi';
import { useTeachingScope } from '../hooks/useTeachingScope';

export default function IndividualSupportPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const locale = useLocale();
  const lq = useListQuery<'status' | 'className'>({ sort: { key: 'sentAt', direction: 'desc' }, descFirst: ['sentAt'] });
  const list = useResourceList(sentSupportApi.list, lq.query);
  const scope = useTeachingScope();
  const all = useAsync((signal) => sentSupportApi.list({ offset: 0, limit: 500 }, signal), [list.total]);
  const candidates = useAsync((signal) => studentInsightApi.list({ offset: 0, limit: 300, filters: { needsSupport: 'yes' }, sortKey: 'average' }, signal), []);
  const [picking, setPicking] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [target, setTarget] = useState<SupportTarget | null>(null);

  const stats = useMemo(() => {
    const items = all.data?.items ?? [];
    const done = items.filter((s) => s.status === 'completed' && s.after !== null);
    const gain = done.length ? Math.round(done.reduce((n, s) => n + ((s.after ?? 0) - s.before), 0) / done.length) : 0;
    return { sent: items.length, completed: done.length, gain };
  }, [all.data]);

  const columns: Column<SentSupport>[] = [
    {
      id: 'student',
      header: t('common.student', { ns: 'common' }),
      rowHeader: true,
      cell: (s) => (
        <span className="flex min-w-[170px] items-center gap-2.5">
          <Avatar name={s.studentName} size={32} />
          <span>
            <span className="block font-semibold text-foreground">{s.studentName}</span>
            <span className="block text-[12.5px] font-normal text-muted-foreground">{s.className}</span>
          </span>
        </span>
      ),
    },
    { id: 'topic', header: t('common.topic', { ns: 'common' }), cell: (s) => <span>{s.topic}<span className="block text-[12.5px] text-muted-foreground">{t('common.questions', { ns: 'common', count: s.questionCount })}{s.includeSummary ? ` · ${t('support.summaryIncluded')}` : ''}</span></span> },
    { id: 'sentAt', header: t('common.sentAt', { ns: 'common' }), sortKey: 'sentAt', hideOnMobile: true, cell: (s) => <span className="text-muted-foreground"><RelativeTime iso={s.sentAt} /></span> },
    { id: 'due', header: t('common.due', { ns: 'common' }), hideOnMobile: true, cell: (s) => (s.due ? <DueLabel iso={s.due} /> : '—') },
    { id: 'status', header: t('common.status', { ns: 'common' }), cell: (s) => <Badge tone={s.status === 'completed' ? 'success' : 'warning'} dot>{t(`individual.status.${s.status}`)}</Badge> },
    {
      id: 'gain',
      header: t('individual.change'),
      align: 'right',
      cell: (s) =>
        s.after === null ? (
          <span className="text-muted-foreground tabular-nums">{formatPercent(s.before, locale)} → …</span>
        ) : (
          <span className="tabular-nums">
            {formatPercent(s.before, locale)} <ArrowRight className="inline h-3.5 w-3.5" aria-label={t('individual.to')} /> <span className="font-semibold text-foreground">{formatPercent(s.after, locale)}</span>{' '}
            <span className="font-semibold text-success">+{s.after - s.before}</span>
          </span>
        ),
    },
  ];

  const pick = () => {
    const s = candidates.data?.items.find((x) => x.id === studentId);
    if (!s) return;
    setPicking(false);
    setTarget({ studentId: s.id, studentName: s.name, className: s.className, topics: s.topics.map((tp) => ({ id: tp.name, name: tp.name, percent: tp.percent })), initialTopicId: s.weakTopic?.name ?? s.topics[0]?.name ?? '' });
  };

  return (
    <>
      <PageHeader
        title={t('nav.teacher.individualSupport', { ns: 'common' })}
        description={t('individual.description')}
        actions={
          <Button icon={<Send className="h-4 w-4" aria-hidden />} onClick={() => setPicking(true)}>
            {t('individual.new')}
          </Button>
        }
      />
      <section aria-label={t('individual.summary')} className="mb-6 grid gap-4 md:grid-cols-3">
        <StatTile tone="violet" icon={HeartHandshake} label={t('individual.sent')} value={stats.sent} />
        <StatTile tone="mint" icon={UserCheck} label={t('individual.completed')} value={stats.completed} />
        <StatTile tone="peach" icon={TrendingUp} label={t('individual.avgGain')} value={`+${stats.gain}`} />
      </section>
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('individual.searchPlaceholder')}
        filters={[
          { key: 'status', label: t('common.status', { ns: 'common' }), value: lq.filters.status ?? '', allLabel: t('common.allStatuses', { ns: 'common' }), options: (['pending', 'completed'] as const).map((v) => ({ value: v, label: t(`individual.status.${v}`) })) },
          { key: 'className', label: t('common.class', { ns: 'common' }), value: lq.filters.className ?? '', allLabel: t('common.allClasses', { ns: 'common' }), options: scope.classNames.map((c) => ({ value: c, label: c })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'status' | 'className', v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('nav.teacher.individualSupport', { ns: 'common' })}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        empty={{ icon: <HeartHandshake className="h-5 w-5" aria-hidden />, title: t('individual.empty') }}
      />
      <Modal
        open={picking}
        onClose={() => setPicking(false)}
        size="sm"
        title={t('individual.new')}
        description={t('individual.pickHint', { value: TOPIC_REVIEW_THRESHOLD })}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPicking(false)}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button disabled={!studentId} onClick={pick}>
              {t('actions.next', { ns: 'common' })}
            </Button>
          </>
        }
      >
        <Select
          label={t('common.student', { ns: 'common' })}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholderOption={t('common.selectPlaceholder', { ns: 'common' })}
          options={(candidates.data?.items ?? []).map((s) => ({ value: s.id, label: `${s.name} · ${s.className} · ${s.weakTopic?.name ?? ''} ${s.weakTopic ? formatPercent(s.weakTopic.percent, locale) : ''}` }))}
        />
      </Modal>
      <SupportExerciseModal
        target={target}
        onClose={() => {
          setTarget(null);
          list.refresh();
        }}
      />
    </>
  );
}
