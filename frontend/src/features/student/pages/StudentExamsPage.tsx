import clsx from 'clsx';
import { CalendarClock, CheckCircle2, ClipboardList, Clock3, PlayCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { type QuizQuestion, QuizPlayer } from '@/components/quiz/QuizPlayer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/toastContext';
import { IS_MOCK_MODE } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { useOpenParam } from '@/hooks/useOpenParam';
import { formatDate, formatPercent, formatTime } from '@/utils/format';
import { subjectIcon } from '../subjectIcon';
import { examApi, examQuestions, saveMistakes, submitExam } from '../services/studentApi';
import type { StudentExam } from '../types';

type View = 'now' | 'upcoming' | 'past';
const STATUS_TONE = { available: 'lime', upcoming: 'info', completed: 'success', missed: 'danger' } as const;

export default function StudentExamsPage() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const { data, error, loading, reload } = useAsync((signal) => examApi.list({ offset: 0, limit: 100, sortKey: 'date' }, signal), []);
  const [view, setView] = useState<View>('now');
  const [running, setRunning] = useState<{ exam: StudentExam; questions: QuizQuestion[] } | null>(null);
  const { run, busy } = useAction();
  const { notify } = useToast();
  const notifySubmitted = () => notify({ tone: 'success', title: t('exams.submitted'), description: IS_MOCK_MODE ? t('demo.notPersisted', { ns: 'common' }) : undefined });

  const start = async (exam: StudentExam) => {
    const questions = await run(() => examQuestions(exam));
    if (questions) setRunning({ exam, questions });
  };
  useOpenParam((id) => {
    const exam = data?.items.find((e) => e.id === id);
    if (exam?.status === 'available') void start(exam);
    else if (exam) setView(exam.status === 'upcoming' ? 'upcoming' : 'past');
  }, Boolean(data));

  const items = (data?.items ?? []).filter((e) => (view === 'now' ? e.status === 'available' : view === 'upcoming' ? e.status === 'upcoming' : e.status === 'completed' || e.status === 'missed'));
  const count = (v: View) => (data?.items ?? []).filter((e) => (v === 'now' ? e.status === 'available' : v === 'upcoming' ? e.status === 'upcoming' : e.status === 'completed' || e.status === 'missed')).length;

  return (
    <>
      <PageHeader title={t('nav.student.exams', { ns: 'common' })} description={t('exams.description')} />
      <Tabs<View>
        className="mb-4"
        label={t('exams.viewLabel')}
        value={view}
        onChange={setView}
        items={[
          { value: 'now', label: t('exams.now'), count: count('now') },
          { value: 'upcoming', label: t('exams.upcoming'), count: count('upcoming') },
          { value: 'past', label: t('exams.past') },
        ]}
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {() =>
          items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<ClipboardList className="h-5 w-5" aria-hidden />} title={t(`exams.empty.${view}`)} />
            </div>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {(view === 'past' ? [...items].reverse() : items).map((e) => {
                const Icon = subjectIcon(e.subject);
                return (
                  <li key={e.id} className={clsx('panel flex flex-col p-5', e.status === 'available' && 'ring-2 ring-lime')}>
                    <div className="flex items-start gap-3">
                      <span className="icon-tile h-12 w-12 bg-tint-violet text-ink-violet">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-[17px] font-extrabold text-foreground">{e.title}</h2>
                        <p className="text-[13.5px] text-muted-foreground">
                          {formatDate(e.date, locale, { day: 'numeric', month: 'long', weekday: 'short' })} · {formatTime(e.date, locale)}
                        </p>
                      </div>
                      <Badge tone={STATUS_TONE[e.status]} dot>
                        {t(`exams.status.${e.status}`)}
                      </Badge>
                    </div>
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <ClipboardList className="h-4 w-4" aria-hidden />
                        {t('common.questions', { ns: 'common', count: e.questionCount })}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4" aria-hidden />
                        {t('common.minutesShort', { ns: 'common', count: e.durationMinutes })}
                      </span>
                      <span>{t(`exams.kinds.${e.kind}`)}</span>
                    </p>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      {e.status === 'completed' && e.score !== null ? (
                        <p className="text-[14px]">
                          <span className="font-display text-[26px] font-extrabold text-foreground">{formatPercent(e.score, locale)}</span>
                          {e.classAverage !== null && <span className="ml-2 text-muted-foreground">{t('exams.classAverage', { value: formatPercent(e.classAverage, locale) })}</span>}
                        </p>
                      ) : e.status === 'missed' ? (
                        <p className="inline-flex items-center gap-1.5 text-[13.5px] text-danger">
                          <XCircle className="h-4 w-4" aria-hidden />
                          {t('exams.missedHint')}
                        </p>
                      ) : e.status === 'upcoming' ? (
                        <p className="inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
                          <CalendarClock className="h-4 w-4" aria-hidden />
                          {t('exams.opensAt')}
                        </p>
                      ) : (
                        <p className="text-[13.5px] text-muted-foreground">{t('exams.readyHint')}</p>
                      )}
                      {e.status === 'available' && (
                        <Button variant="ink" loading={busy} icon={<PlayCircle className="h-4 w-4" aria-hidden />} onClick={() => void start(e)}>
                          {t('actions.start', { ns: 'common' })}
                        </Button>
                      )}
                      {e.status === 'completed' && <CheckCircle2 className="h-6 w-6 text-success" aria-hidden />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        }
      </AsyncContent>
      <QuizPlayer
        open={running !== null}
        title={running?.exam.title ?? ''}
        subtitle={running ? t('exams.playerHint', { minutes: running.exam.durationMinutes }) : undefined}
        questions={running?.questions ?? []}
        mode="exam"
        durationMinutes={running?.exam.durationMinutes}
        onClose={() => {
          setRunning(null);
          reload();
        }}
        submit={async (answers, seconds) => {
          if (!running) throw new Error('no exam');
          const res = await submitExam(running.exam, running.questions, answers, seconds);
          notifySubmitted();
          return res;
        }}
        onSaveMistakes={async (qs, answers) => {
          await run(() => saveMistakes(qs, answers), { success: t('exams.mistakesSaved', { count: qs.length }) });
        }}
      />
    </>
  );
}
