import clsx from 'clsx';
import { BookMarked, CheckCircle2, RotateCcw, Undo2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ListFooter } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { type QuizQuestion, QuizPlayer } from '@/components/quiz/QuizPlayer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useListQuery } from '@/hooks/useListQuery';
import { useResourceList } from '@/hooks/useResourceList';
import { mistakeApi } from '../services/studentApi';
import type { MistakeEntry } from '../types';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function MistakesPage() {
  const { t } = useTranslation(['student', 'common']);
  const lq = useListQuery<'subject' | 'learned'>({ sort: { key: 'savedAt', direction: 'desc' }, filters: { learned: 'false' }, descFirst: ['savedAt'] });
  const list = useResourceList(mistakeApi.list, lq.query);
  const [retry, setRetry] = useState<MistakeEntry[] | null>(null);
  const { run } = useAction();
  const subjects = [...new Set(list.items.map((m) => m.subject))];

  const toggle = async (m: MistakeEntry) => {
    const saved = await run(() => mistakeApi.update(m.id, { learned: !m.learned }), { success: t(m.learned ? 'mistakes.unlearned' : 'mistakes.learnedToast') });
    if (saved) list.updateItem(saved);
  };

  const questions = useMemo<QuizQuestion[]>(() => (retry ?? []).map((m) => ({ id: m.id, stem: m.stem, options: m.options, answer: m.answer, explanation: m.explanation, subject: m.subject, topic: m.topic })), [retry]);

  return (
    <>
      <PageHeader
        title={t('nav.student.mistakes', { ns: 'common' })}
        description={t('mistakes.description')}
        actions={
          <Button variant="ink" icon={<RotateCcw className="h-4 w-4" aria-hidden />} disabled={list.items.filter((m) => !m.learned).length === 0} onClick={() => setRetry(list.items.filter((m) => !m.learned).slice(0, 10))}>
            {t('mistakes.retryAll', { count: Math.min(10, list.items.filter((m) => !m.learned).length) })}
          </Button>
        }
      />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('mistakes.searchPlaceholder')}
        filters={[
          { key: 'subject', label: t('common.subject', { ns: 'common' }), value: lq.filters.subject ?? '', allLabel: t('common.allSubjects', { ns: 'common' }), options: subjects.map((s) => ({ value: s, label: s })) },
          { key: 'learned', label: t('common.status', { ns: 'common' }), value: lq.filters.learned ?? '', allLabel: t('common.all', { ns: 'common' }), options: [{ value: 'false', label: t('mistakes.toReview') }, { value: 'true', label: t('mistakes.learned') }] },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'subject' | 'learned', v)}
        onClear={lq.clear}
      />
      {list.status === 'error' ? (
        <div className="panel">
          <ErrorState error={list.error} onRetry={list.retry} />
        </div>
      ) : list.status === 'loading' && list.items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-panel" />
          ))}
        </div>
      ) : list.items.length === 0 ? (
        <div className="panel">
          <EmptyState icon={<BookMarked className="h-5 w-5" aria-hidden />} title={t('mistakes.empty')} description={t('mistakes.emptyHint')} />
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <ul className="divide-y divide-border">
            {list.items.map((m) => (
              <li key={m.id} className={clsx('p-5', m.learned && 'opacity-70')}>
                <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
                  <Badge tone="accent">{m.subject}</Badge>
                  <span>{m.topic}</span>·<RelativeTime iso={m.savedAt} />
                  {m.learned && (
                    <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" aria-hidden />}>
                      {t('mistakes.learned')}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-line text-[15.5px] font-semibold leading-relaxed text-foreground">{m.stem}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {m.yourAnswer !== null && (
                    <p className="flex items-start gap-2 rounded-[12px] bg-danger/[0.07] px-3 py-2 text-[14px] text-foreground">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
                      <span>
                        <span className="font-semibold">{t('quiz.yourAnswer', { ns: 'common' })}:</span> {LETTERS[m.yourAnswer]}) {m.options[m.yourAnswer]}
                      </span>
                    </p>
                  )}
                  <p className="flex items-start gap-2 rounded-[12px] bg-success/[0.08] px-3 py-2 text-[14px] text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    <span>
                      <span className="font-semibold">{t('quiz.correctAnswer', { ns: 'common' })}:</span> {LETTERS[m.answer]}) {m.options[m.answer]}
                    </span>
                  </p>
                </div>
                {m.explanation && <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{m.explanation}</p>}
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {!m.learned && (
                    <Button size="sm" variant="secondary" icon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={() => setRetry([m])}>
                      {t('actions.retake', { ns: 'common' })}
                    </Button>
                  )}
                  <Button size="sm" variant={m.learned ? 'ghost' : 'soft'} icon={m.learned ? <Undo2 className="h-4 w-4" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />} onClick={() => void toggle(m)}>
                    {m.learned ? t('mistakes.markUnlearned') : t('mistakes.markLearned')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <ListFooter list={list} />
        </div>
      )}
      <QuizPlayer
        open={retry !== null}
        title={t('mistakes.retryTitle')}
        subtitle={t('mistakes.retryHint')}
        questions={questions}
        mode="practice"
        onClose={() => {
          setRetry(null);
          list.refresh();
        }}
        onFinish={async (result) => {
          const learned = (retry ?? []).filter((_, i) => result.answers[i] === questions[i]?.answer);
          if (learned.length) await run(async () => {
            for (const m of learned) await mistakeApi.update(m.id, { learned: true });
            return true;
          }, { success: t('mistakes.learnedCount', { count: learned.length }) });
        }}
      />
    </>
  );
}
