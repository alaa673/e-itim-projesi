import clsx from 'clsx';
import { ArrowRight, BookOpenCheck, CheckCircle2, HeartHandshake, PlayCircle, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import supportBook from '@/assets/illustrations/support-book.webp';
import { PageHeader } from '@/components/layout/PageHeader';
import { DueLabel, RelativeTime } from '@/components/layout/RelativeTime';
import { type QuizQuestion, QuizPlayer } from '@/components/quiz/QuizPlayer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AsyncContent, EmptyState, Skeleton } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { useOpenParam } from '@/hooks/useOpenParam';
import { formatPercent } from '@/utils/format';
import { saveMistakes, supportApi } from '../services/studentApi';
import type { SupportExerciseItem } from '../types';

export default function SupportWorkPage() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const { data, error, loading, reload } = useAsync((signal) => supportApi.list(signal), []);
  const [open, setOpen] = useState<SupportExerciseItem | null>(null);
  const [quiz, setQuiz] = useState<{ item: SupportExerciseItem; questions: QuizQuestion[] } | null>(null);
  const [done, setDone] = useState<SupportExerciseItem | null>(null);
  const { run, busy } = useAction();
  useOpenParam((id) => setOpen(data?.find((s) => s.id === id) ?? null), Boolean(data));

  const start = async (item: SupportExerciseItem) => {
    const questions = await run(() => supportApi.questions(item));
    if (questions) {
      setOpen(null);
      setQuiz({ item, questions });
    }
  };

  return (
    <>
      <PageHeader title={t('nav.student.supportWork', { ns: 'common' })} description={t('support.description')} />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(items) =>
          items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<HeartHandshake className="h-5 w-5" aria-hidden />} title={t('support.empty')} />
            </div>
          ) : (
            <ul className="space-y-4">
              {[...items].sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed')).map((s) => (
                <li key={s.id} className={clsx('panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center', s.status === 'pending' && 'ring-2 ring-primary/30')}>
                  <img src={supportBook} alt="" aria-hidden className="h-[72px] w-[104px] shrink-0 object-contain" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-[18px] font-extrabold text-foreground">{s.topic}</h2>
                      <Badge tone={s.status === 'completed' ? 'success' : 'warning'} dot>
                        {t(`support.status.${s.status}`)}
                      </Badge>
                    </div>
                    <p className="text-[13.5px] text-muted-foreground">
                      {s.subject} · {s.teacher} · <RelativeTime iso={s.sentAt} />
                    </p>
                    <p className="mt-1 text-[14px] text-foreground">
                      {s.includesSummary ? t('support.withSummary', { count: s.questionCount }) : t('common.questions', { ns: 'common', count: s.questionCount })}
                      {s.status === 'pending' && s.due && (
                        <span className="text-muted-foreground">
                          {' '}
                          · {t('common.due', { ns: 'common' })}: <DueLabel iso={s.due} />
                        </span>
                      )}
                    </p>
                  </div>
                  {s.status === 'completed' && s.after !== null ? (
                    <p className="flex items-center gap-2 text-[14px]">
                      <span className="tabular-nums text-muted-foreground">{formatPercent(s.before, locale)}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" aria-label={t('support.then')} />
                      <span className="font-display text-[20px] font-extrabold tabular-nums text-foreground">{formatPercent(s.after, locale)}</span>
                      <Badge tone={s.after >= s.before ? 'success' : 'danger'} icon={<TrendingUp className="h-3 w-3" aria-hidden />}>
                        {s.after >= s.before ? '+' : ''}
                        {s.after - s.before}
                      </Badge>
                    </p>
                  ) : (
                    <Button variant="ink" icon={<PlayCircle className="h-4 w-4" aria-hidden />} onClick={() => setOpen(s)}>
                      {t('support.open')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )
        }
      </AsyncContent>

      <SupportIntro item={open} busy={busy} onClose={() => setOpen(null)} onStart={(i) => void start(i)} />

      <QuizPlayer
        open={quiz !== null}
        title={quiz ? t('support.quizTitle', { topic: quiz.item.topic }) : ''}
        subtitle={quiz ? t('support.quizHint') : undefined}
        questions={quiz?.questions ?? []}
        mode="practice"
        onClose={() => {
          setQuiz(null);
          reload();
        }}
        onFinish={async (result) => {
          if (!quiz) return;
          const updated = await run(() => supportApi.complete(quiz.item.id, result), { success: t('support.completedToast') });
          if (updated) setDone(updated);
        }}
        onSaveMistakes={async (qs, answers) => {
          await run(() => saveMistakes(qs, answers), { success: t('exams.mistakesSaved', { count: qs.length }) });
        }}
      />

      <Modal open={done !== null && quiz === null} onClose={() => setDone(null)} size="sm" title={t('support.doneTitle')}>
        {done && done.after !== null && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
            <p className="mt-3 text-[15px] text-foreground">{t('support.doneBody', { topic: done.topic, before: formatPercent(done.before, locale), after: formatPercent(done.after, locale) })}</p>
          </div>
        )}
      </Modal>
    </>
  );
}

function SupportIntro({ item, busy, onClose, onStart }: { item: SupportExerciseItem | null; busy: boolean; onClose: () => void; onStart: (i: SupportExerciseItem) => void }) {
  const { t } = useTranslation(['student', 'common']);
  const summary = useAsync((signal) => (item?.includesSummary ? supportApi.summary(item.topic, signal) : Promise.resolve(null)), [item?.id]);
  return (
    <Modal
      open={item !== null}
      onClose={onClose}
      size="lg"
      title={item ? t('support.introTitle', { topic: item.topic }) : ''}
      description={item ? t('support.introFrom', { teacher: item.teacher }) : undefined}
      footer={
        item && (
          <Button variant="ink" loading={busy} icon={<PlayCircle className="h-4 w-4" aria-hidden />} onClick={() => onStart(item)}>
            {t('support.startQuestions', { count: item.questionCount })}
          </Button>
        )
      }
    >
      {item?.includesSummary ? (
        <section aria-labelledby="sum-title">
          <h3 id="sum-title" className="flex items-center gap-2 font-display text-[16px] font-extrabold text-foreground">
            <BookOpenCheck className="h-5 w-5 text-accent-ink" aria-hidden />
            {t('support.summaryTitle')}
          </h3>
          {summary.loading && !summary.data ? (
            <Skeleton className="mt-3 h-32 rounded-[14px]" />
          ) : summary.data ? (
            <ol className="mt-3 space-y-2.5">
              {summary.data.split('\n').filter(Boolean).map((line, i) => (
                <li key={i} className="flex gap-3 rounded-[14px] bg-surface-muted p-3 text-[14.5px] leading-relaxed text-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">{i + 1}</span>
                  {line}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-[14px] text-muted-foreground">{t('support.noSummary')}</p>
          )}
        </section>
      ) : (
        <p className="text-[14.5px] text-foreground">{t('support.noSummaryIncluded')}</p>
      )}
      <p className="mt-4 text-[13px] text-muted-foreground">{t('support.howItWorks')}</p>
    </Modal>
  );
}
