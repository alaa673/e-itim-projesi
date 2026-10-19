import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight, Award, MessageSquareWarning } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/providers/authContext';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { useLocale } from '@/hooks/useLocale';
import { useResourceList } from '@/hooks/useResourceList';
import { formatDate, formatNumber } from '@/utils/format';
import { resultApi, sendAppeal, subjectApi } from '../services/studentApi';
import type { ResultEntry } from '../types';

export default function ResultsPage() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const { user } = useAuth();
  const lq = useListQuery<'subject' | 'kind'>({ sort: { key: 'date', direction: 'desc' }, descFirst: ['date'] });
  const list = useResourceList(resultApi.list, lq.query);
  const subjects = useAsync((signal) => subjectApi.list(signal), []);
  const [appeal, setAppeal] = useState<ResultEntry | null>(null);
  const [kind, setKind] = useState<'score' | 'question'>('question');
  const [questionNo, setQuestionNo] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();

  const fmt = (r: ResultEntry, v: number) => (r.kind === 'mock' ? formatNumber(v, locale) : `${formatNumber(v, locale)}`);

  const columns: Column<ResultEntry>[] = [
    {
      id: 'title',
      header: t('results.item'),
      rowHeader: true,
      cell: (r) => (
        <span className="block min-w-[200px]">
          <span className="block font-semibold text-foreground">{r.title}</span>
          <span className="block text-[12.5px] font-normal text-muted-foreground">{r.subject}</span>
        </span>
      ),
    },
    { id: 'kind', header: t('common.type', { ns: 'common' }), cell: (r) => <Badge tone={r.kind === 'mock' ? 'achievement' : r.kind === 'homework' ? 'info' : 'accent'}>{t(`results.kinds.${r.kind}`)}</Badge> },
    { id: 'date', header: t('common.date', { ns: 'common' }), sortKey: 'date', hideOnMobile: true, cell: (r) => <span className="text-muted-foreground">{formatDate(r.date, locale)}</span> },
    { id: 'score', header: t('common.score', { ns: 'common' }), align: 'right', cell: (r) => <span className="font-display text-[17px] font-extrabold tabular-nums text-foreground">{fmt(r, r.score)}</span> },
    {
      id: 'vs',
      header: t('results.vsClass'),
      align: 'right',
      cell: (r) => {
        const diff = r.score - r.classAverage;
        return (
          <span className={clsx('inline-flex items-center gap-0.5 text-[13px] font-semibold tabular-nums', diff >= 0 ? 'text-success' : 'text-danger')}>
            {diff >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
            {diff >= 0 ? '+' : '−'}
            {formatNumber(Math.abs(diff), locale)}
            <span className="ml-1 font-normal text-muted-foreground">({fmt(r, r.classAverage)})</span>
          </span>
        );
      },
    },
    { id: 'feedback', header: t('common.feedback', { ns: 'common' }), hideOnMobile: true, cell: (r) => <span className="line-clamp-2 max-w-[260px] text-[13.5px] text-muted-foreground">{r.feedback ?? '—'}</span> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (r) =>
        r.kind !== 'mock' ? (
          <Button
            size="sm"
            variant="ghost"
            icon={<MessageSquareWarning className="h-4 w-4" aria-hidden />}
            aria-label={`${t('results.appeal')}: ${r.title}`}
            onClick={() => {
              setAppeal(r);
              setKind('question');
              setQuestionNo('');
              setMessage('');
              setTouched(false);
            }}
          >
            {t('results.appeal')}
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader title={t('nav.student.results', { ns: 'common' })} description={t('results.description')} />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('results.searchPlaceholder')}
        filters={[
          { key: 'subject', label: t('common.subject', { ns: 'common' }), value: lq.filters.subject ?? '', allLabel: t('common.allSubjects', { ns: 'common' }), options: [...(subjects.data ?? []).map((s) => s.name), 'LGS', 'TYT'].map((v) => ({ value: v, label: v })) },
          { key: 'kind', label: t('common.type', { ns: 'common' }), value: lq.filters.kind ?? '', allLabel: t('common.allTypes', { ns: 'common' }), options: (['exam', 'homework', 'mock'] as const).map((v) => ({ value: v, label: t(`results.kinds.${v}`) })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'subject' | 'kind', v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('nav.student.results', { ns: 'common' })}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={appeal?.id ?? null}
        empty={{ icon: <Award className="h-5 w-5" aria-hidden />, title: t('results.empty') }}
      />
      <Modal
        open={appeal !== null}
        onClose={() => setAppeal(null)}
        preventClose={busy}
        title={t('results.appealTitle')}
        description={appeal ? `${appeal.title} · ${appeal.subject}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAppeal(null)} disabled={busy}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                setTouched(true);
                if (!appeal || message.trim().length < 10) return;
                const ok = await run(
                  () => sendAppeal({ result: appeal, kind, questionNo: questionNo ? Number(questionNo) : null, message: message.trim(), studentName: user ? `${user.firstName} ${user.lastName}` : '', className: user?.grade ? `${user.grade}-${user.section}` : '' }),
                  { success: t('results.appealSent') },
                );
                if (ok) setAppeal(null);
              }}
            >
              {t('actions.send', { ns: 'common' })}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <SegmentedControl label={t('results.appealKind')} value={kind} onChange={setKind} options={[{ value: 'question', label: t('results.kindQuestion') }, { value: 'score', label: t('results.kindScore') }]} />
          <Input label={`${t('results.questionNo')} (${t('common.optional', { ns: 'common' })})`} type="number" min={1} max={200} value={questionNo} onChange={(e) => setQuestionNo(e.target.value)} containerClassName="max-w-[200px]" />
          <Textarea label={t('results.appealMessage')} rows={4} value={message} maxLength={1000} onChange={(e) => setMessage(e.target.value)} placeholder={t('results.appealPlaceholder')} error={touched && message.trim().length < 10 ? t('validation.tooShort', { ns: 'common' }) : undefined} />
          <p className="text-[12.5px] text-muted-foreground">{t('results.appealNote')}</p>
        </div>
      </Modal>
    </>
  );
}
