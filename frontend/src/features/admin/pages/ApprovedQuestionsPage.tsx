import clsx from 'clsx';
import { Archive, ArchiveRestore, CheckCircle2, Copy, Download, Eye, Library } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Column } from '@/components/ui/DataTable';
import { DetailList } from '@/components/ui/DetailList';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { useResourceList } from '@/hooks/useResourceList';
import type { ArchiveQuestion, ExamType } from '@/types';
import { downloadCsv } from '@/utils/csv';
import { approvedApi, archiveSubjects } from '../services/adminApi';
import { DIFF_TONE } from '@/config/catalog';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
type F = 'examType' | 'year' | 'subject' | 'difficulty' | 'status' | 'duplicates';

export default function ApprovedQuestionsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const lq = useListQuery<F>({ sort: { key: 'year', direction: 'desc' }, filters: { status: 'active' }, descFirst: ['year', 'usedCount'] });
  const list = useResourceList(approvedApi.list, lq.query);
  const subjects = useAsync(() => archiveSubjects(), []);
  const [preview, setPreview] = useState<ArchiveQuestion | null>(null);
  const { run } = useAction();

  const allSubjects = [...new Set(Object.values(subjects.data ?? {}).flat())].sort((a, b) => a.localeCompare(b, 'tr'));
  const toggleArchive = async (q: ArchiveQuestion) => {
    const next = q.status === 'active' ? 'archived' : 'active';
    const saved = await run(() => approvedApi.update(q.id, { status: next }), { success: t(next === 'archived' ? 'approved.archived' : 'approved.restored') });
    if (saved) {
      list.updateItem(saved);
      if (preview?.id === q.id) setPreview(saved);
    }
  };

  const columns: Column<ArchiveQuestion>[] = [
    { id: 'year', header: t('approved.exam'), sortKey: 'year', cell: (q) => <span className="whitespace-nowrap font-semibold tabular-nums text-foreground">{q.examType} {q.year} · {q.number}</span> },
    { id: 'subject', header: t('common.subject', { ns: 'common' }), sortKey: 'subject', cell: (q) => <span className="whitespace-nowrap">{q.subject}</span> },
    { id: 'topic', header: t('common.topic', { ns: 'common' }), hideOnMobile: true, cell: (q) => q.topic },
    {
      id: 'stem',
      header: t('approved.question'),
      rowHeader: true,
      cell: (q) => (
        <span className="block max-w-[360px]">
          <span className="line-clamp-2 font-normal text-foreground">{q.stem}</span>
          {q.duplicateOf && (
            <Badge tone="warning" className="mt-1" icon={<Copy className="h-3 w-3" aria-hidden />}>
              {t('approved.possibleDuplicate')}
            </Badge>
          )}
        </span>
      ),
    },
    { id: 'difficulty', header: t('common.difficulty', { ns: 'common' }), cell: (q) => <Badge tone={DIFF_TONE[q.difficulty]}>{t(`difficultyShort.${q.difficulty}`, { ns: 'common' })}</Badge> },
    { id: 'usedCount', header: t('approved.used'), sortKey: 'usedCount', align: 'right', hideOnMobile: true, cell: (q) => <span className="tabular-nums">{q.usedCount}</span> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (q) => (
        <span className="flex justify-end gap-1">
          <IconButton icon={Eye} label={`${t('actions.preview', { ns: 'common' })}: ${q.examType} ${q.year} ${q.number}`} onClick={() => setPreview(q)} />
          <IconButton
            icon={q.status === 'active' ? Archive : ArchiveRestore}
            tone={q.status === 'active' ? 'danger' : 'accent'}
            label={`${t(q.status === 'active' ? 'actions.archive' : 'actions.restore', { ns: 'common' })}: ${q.examType} ${q.year} ${q.number}`}
            onClick={() => void toggleArchive(q)}
          />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('approved.title')}
        description={t('approved.description')}
        actions={
          <Button
            variant="secondary"
            icon={<Download className="h-4 w-4" aria-hidden />}
            disabled={list.items.length === 0}
            onClick={() =>
              downloadCsv('pusula-onayli-sorular', [
                [t('approved.exam'), t('common.year', { ns: 'common' }), 'No', t('common.subject', { ns: 'common' }), t('common.topic', { ns: 'common' }), t('common.difficulty', { ns: 'common' }), t('approved.question'), 'A', 'B', 'C', 'D', 'E', t('common.answer', { ns: 'common' })],
                ...list.items.map((q) => [q.examType, q.year, q.number, q.subject, q.topic, t(`difficultyShort.${q.difficulty}`, { ns: 'common' }), q.stem, ...LETTERS.map((_, i) => q.options[i] ?? ''), q.answer]),
              ])
            }
          >
            {t('approved.exportLoaded', { count: list.items.length })}
          </Button>
        }
      />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('approved.searchPlaceholder')}
        filters={[
          { key: 'examType', label: t('common.examType', { ns: 'common' }), value: lq.filters.examType ?? '', allLabel: t('common.allTypes', { ns: 'common' }), options: (['LGS', 'TYT', 'AYT'] as ExamType[]).map((v) => ({ value: v, label: v })) },
          { key: 'year', label: t('common.year', { ns: 'common' }), value: lq.filters.year ?? '', allLabel: t('common.allYears', { ns: 'common' }), options: ['2025', '2024', '2023'].map((v) => ({ value: v, label: v })) },
          { key: 'subject', label: t('common.subject', { ns: 'common' }), value: lq.filters.subject ?? '', allLabel: t('common.allSubjects', { ns: 'common' }), options: allSubjects.map((v) => ({ value: v, label: v })) },
          { key: 'difficulty', label: t('common.difficulty', { ns: 'common' }), value: lq.filters.difficulty ?? '', allLabel: t('common.all', { ns: 'common' }), options: (['easy', 'medium', 'hard'] as const).map((v) => ({ value: v, label: t(`difficultyShort.${v}`, { ns: 'common' }) })) },
          {
            key: 'status',
            label: t('common.status', { ns: 'common' }),
            value: lq.filters.status ?? '',
            allLabel: t('common.allStatuses', { ns: 'common' }),
            options: [
              { value: 'active', label: t('approved.status.active') },
              { value: 'archived', label: t('approved.status.archived') },
            ],
          },
        ]}
        onFilter={(k, v) => lq.setFilter(k as F, v)}
        onClear={lq.clear}
        extra={
          <label className="flex h-11 items-center gap-2 text-[14px] text-foreground">
            <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--primary))]" checked={lq.filters.duplicates === 'yes'} onChange={(e) => lq.setFilter('duplicates', e.target.checked ? 'yes' : '')} />
            {t('approved.onlyDuplicates')}
          </label>
        }
      />
      <ResourceTable
        caption={t('approved.title')}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={preview?.id ?? null}
        rowClassName={(q) => (q.status === 'archived' ? 'opacity-60' : undefined)}
        empty={{ icon: <Library className="h-5 w-5" aria-hidden />, title: t('approved.empty') }}
      />

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        variant="side"
        title={preview ? `${preview.examType} ${preview.year} · ${t('approved.questionNo', { number: preview.number })}` : ''}
        description={preview ? `${preview.subject} · ${preview.topic}` : undefined}
        footer={
          preview && (
            <Button variant="secondary" icon={preview.status === 'active' ? <Archive className="h-4 w-4" aria-hidden /> : <ArchiveRestore className="h-4 w-4" aria-hidden />} onClick={() => void toggleArchive(preview)}>
              {t(preview.status === 'active' ? 'actions.archive' : 'actions.restore', { ns: 'common' })}
            </Button>
          )
        }
      >
        {preview && (
          <>
            <p className="whitespace-pre-line text-[16px] font-semibold leading-relaxed text-foreground">{preview.stem}</p>
            <ol className="mt-4 space-y-2">
              {preview.options.map((o, i) => {
                const correct = LETTERS[i] === preview.answer;
                return (
                  <li key={i} className={clsx('flex items-center gap-3 rounded-[12px] border px-3 py-2.5 text-[14.5px]', correct ? 'border-success bg-success/[0.08]' : 'border-border')}>
                    <span className={clsx('flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold', correct ? 'bg-success text-white' : 'bg-surface-muted text-foreground')}>{LETTERS[i]}</span>
                    <span className="flex-1 text-foreground">{o}</span>
                    {correct && <CheckCircle2 className="h-4 w-4 text-success" aria-label={t('quiz.correctAnswer', { ns: 'common' })} />}
                  </li>
                );
              })}
            </ol>
            <DetailList
              className="mt-6"
              items={[
                { label: t('common.difficulty', { ns: 'common' }), value: t(`difficultyShort.${preview.difficulty}`, { ns: 'common' }) },
                { label: t('approved.used'), value: preview.usedCount },
                { label: t('common.status', { ns: 'common' }), value: t(`approved.status.${preview.status}`) },
                { label: t('approved.duplicate'), value: preview.duplicateOf ? t('approved.duplicateOf', { id: preview.duplicateOf }) : t('common.none', { ns: 'common' }) },
              ]}
            />
          </>
        )}
      </Modal>
    </>
  );
}
