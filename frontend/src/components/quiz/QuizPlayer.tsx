import clsx from 'clsx';
import { ArrowLeft, ArrowRight, BookmarkPlus, Check, CheckCircle2, CircleDashed, Clock3, Flag, XCircle } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useLocale } from '@/hooks/useLocale';
import { errorMessageKey } from '@/utils/errorHandling';
import { formatNumber, formatPercent } from '@/utils/format';

export interface QuizQuestion {
  id: string;
  stem: string;
  options: string[];
  /**
   * Index of the correct option. Practice questions carry it; graded exams do not —
   * the server returns the key when the answers are submitted (see `submit`).
   */
  answer?: number;
  explanation?: string;
  subject?: string;
  topic?: string;
}

export interface QuizResult {
  correct: number;
  wrong: number;
  blank: number;
  percent: number;
  /** Net score when a penalty rule applies (LGS: 3 wrong cancel 1 right, YKS: 4 wrong cancel 1 right). */
  net: number | null;
  answers: (number | null)[];
  durationSeconds: number;
}

/** Server grading returned by `submit`: the answer key (and explanations) in question order. */
export interface QuizGrade {
  answerKey: number[];
  explanations?: (string | null)[];
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const PENALTY = { LGS: 3, YKS: 4 } as const;

function scoreQuiz(questions: QuizQuestion[], answers: (number | null)[], rule: keyof typeof PENALTY | null, durationSeconds = 0): QuizResult {
  let correct = 0;
  let wrong = 0;
  questions.forEach((q, i) => {
    const a = answers[i];
    if (a === null || a === undefined) return;
    if (q.answer !== undefined && a === q.answer) correct += 1;
    else wrong += 1;
  });
  const blank = questions.length - correct - wrong;
  const net = rule ? Math.round((correct - wrong / PENALTY[rule]) * 100) / 100 : null;
  return { correct, wrong, blank, percent: questions.length ? Math.round((correct / questions.length) * 100) : 0, net, answers, durationSeconds };
}

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Quiz / exam runner used by student exams, topic practice, mock exams, support work and the mistake notebook.
 * practice: answers are checked one by one with explanations (questions must carry `answer`).
 * exam: feedback after submitting (optional timer). With `submit`, the answers go to the server first and
 * the returned answer key drives the result and review, so exam questions never need to carry answers.
 */
export function QuizPlayer({
  open,
  title,
  subtitle,
  questions,
  mode = 'exam',
  durationMinutes,
  netRule = null,
  onClose,
  onFinish,
  onSaveMistakes,
  submit,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  questions: QuizQuestion[];
  mode?: 'practice' | 'exam';
  durationMinutes?: number;
  netRule?: keyof typeof PENALTY | null;
  onClose: () => void;
  onFinish?: (result: QuizResult) => void | Promise<void>;
  onSaveMistakes?: (questions: QuizQuestion[], answers: (number | null)[]) => void | Promise<void>;
  /** Sends the answers for server-side scoring and resolves with the answer key. */
  submit?: (answers: (number | null)[], durationSeconds: number) => Promise<QuizGrade>;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const groupId = useId();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [flags, setFlags] = useState<boolean[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mistakesSaved, setMistakesSaved] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [graded, setGraded] = useState<QuizQuestion[] | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const startedAt = useRef(Date.now());

  // Reset when a quiz opens (or a different question set is loaded while open).
  const questionKey = questions.map((q) => q.id).join('|');
  useEffect(() => {
    if (!open) return;
    const n = questionKey ? questionKey.split('|').length : 0;
    setIndex(0);
    setAnswers(Array.from({ length: n }, () => null));
    setChecked(Array.from({ length: n }, () => false));
    setFlags(Array.from({ length: n }, () => false));
    setResult(null);
    setGraded(null);
    setSubmitError(null);
    setConfirming(false);
    setMistakesSaved(false);
    setRemaining(durationMinutes ? durationMinutes * 60 : null);
    startedAt.current = Date.now();
  }, [open, questionKey, durationMinutes]);

  const finish = useCallback(async () => {
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    setConfirming(false);
    let keyed = questions;
    if (submit) {
      setSaving(true);
      setSubmitError(null);
      try {
        const grade = await submit(answers, seconds);
        keyed = questions.map((q, i) => ({ ...q, answer: grade.answerKey[i] ?? q.answer, explanation: grade.explanations?.[i] ?? q.explanation }));
      } catch (error) {
        // Answers stay on screen; the student can retry.
        setSubmitError(error);
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    const r = scoreQuiz(keyed, answers, netRule, seconds);
    setGraded(keyed);
    setResult(r);
    if (onFinish) {
      setSaving(true);
      try {
        await onFinish(r);
      } finally {
        setSaving(false);
      }
    }
  }, [answers, netRule, onFinish, questions, submit]);

  // Countdown (exam mode with a duration). Submits automatically at zero.
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => {
    if (!open || result || remaining === null) return;
    if (remaining <= 0) {
      void finishRef.current();
      return;
    }
    const timer = window.setTimeout(() => setRemaining((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [open, remaining, result]);

  const q = questions[index];
  const answered = answers.filter((a) => a !== null && a !== undefined).length;
  const isChecked = mode === 'practice' && checked[index];
  const timeUp = remaining !== null && remaining <= 0;
  const choose = (option: number) => {
    if (isChecked || result || timeUp || saving) return;
    setAnswers((prev) => prev.map((a, i) => (i === index ? option : a)));
  };
  const go = (to: number) => setIndex(Math.max(0, Math.min(questions.length - 1, to)));

  const onKey = (event: React.KeyboardEvent) => {
    if (result || !q) return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text')) return;
    const letter = LETTERS.indexOf(event.key.toUpperCase());
    const digit = Number(event.key) - 1;
    const pickIndex = letter >= 0 ? letter : digit >= 0 && digit < 5 ? digit : -1;
    if (pickIndex >= 0 && pickIndex < q.options.length) {
      event.preventDefault();
      choose(pickIndex);
    }
  };

  const review = useMemo(
    () => (result ? (graded ?? questions).map((question, i) => ({ question, answer: result.answers[i] ?? null })) : []),
    [graded, questions, result],
  );
  const wrongItems = review.filter((r) => r.answer !== r.question.answer);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      preventClose={saving}
      title={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {title}
          {mode === 'exam' && remaining !== null && !result && (
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[13px] font-semibold tabular-nums',
                remaining < 60 ? 'bg-danger/10 text-danger' : 'bg-accent-soft text-accent-ink',
              )}
              role="timer"
              aria-label={t('quiz.timeLeft', { time: formatClock(remaining) })}
            >
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              {formatClock(remaining)}
            </span>
          )}
        </span>
      }
      description={subtitle}
    >
      {questions.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">{t('quiz.noQuestions')}</p>
      ) : result ? (
        <div>
          <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
            <div className="mx-auto flex h-[160px] w-[160px] flex-col items-center justify-center rounded-full border-[10px] border-accent-soft bg-surface text-center shadow-card">
              <span className="font-display text-[40px] font-extrabold leading-none text-foreground">{formatPercent(result.percent, locale)}</span>
              <span className="mt-1 text-[13px] text-muted-foreground">{t('quiz.success')}</span>
            </div>
            <div>
              <p className="font-display text-[22px] font-extrabold text-foreground">
                {result.percent >= 85 ? t('quiz.verdict.great') : result.percent >= 60 ? t('quiz.verdict.good') : t('quiz.verdict.keepGoing')}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <ResultTile icon={CheckCircle2} tone="text-success" label={t('quiz.correct')} value={result.correct} />
                <ResultTile icon={XCircle} tone="text-danger" label={t('quiz.wrong')} value={result.wrong} />
                <ResultTile icon={CircleDashed} tone="text-muted-foreground" label={t('quiz.blank')} value={result.blank} />
              </div>
              {result.net !== null && (
                <p className="mt-3 text-[14.5px] text-foreground">
                  <span className="font-semibold">{t('quiz.net')}:</span> {formatNumber(result.net, locale, { maximumFractionDigits: 2 })}{' '}
                  <span className="text-muted-foreground">({t(netRule === 'LGS' ? 'quiz.netRuleLgs' : 'quiz.netRuleYks')})</span>
                </p>
              )}
              {saving && <p className="mt-2 text-[13px] text-muted-foreground">{t('quiz.saving')}</p>}
            </div>
          </div>

          <h3 className="mt-6 font-display text-[17px] font-extrabold text-foreground">{t('quiz.review')}</h3>
          <ol className="mt-3 space-y-3">
            {review.map(({ question, answer }, i) => {
              const ok = answer === question.answer;
              return (
                <li key={question.id} className={clsx('rounded-[14px] border p-4', ok ? 'border-success/30 bg-success/[0.05]' : 'border-danger/25 bg-danger/[0.04]')}>
                  <p className="flex gap-2 text-[14.5px] font-semibold text-foreground">
                    <span className="tabular-nums text-muted-foreground">{i + 1}.</span>
                    <span className="whitespace-pre-line">{question.stem}</span>
                  </p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px]">
                    <span className={ok ? 'text-success' : 'text-danger'}>
                      {ok ? <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden /> : <XCircle className="mr-1 inline h-3.5 w-3.5" aria-hidden />}
                      {t('quiz.yourAnswer')}: {answer === null ? t('quiz.blank') : `${LETTERS[answer]}) ${question.options[answer]}`}
                    </span>
                    {!ok && question.answer !== undefined && (
                      <span className="text-foreground">
                        {t('quiz.correctAnswer')}: {LETTERS[question.answer]}) {question.options[question.answer]}
                      </span>
                    )}
                  </p>
                  {question.explanation && <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{question.explanation}</p>}
                </li>
              );
            })}
          </ol>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            {onSaveMistakes && wrongItems.length > 0 && (
              <Button
                variant="secondary"
                icon={<BookmarkPlus className="h-4 w-4" aria-hidden />}
                disabled={mistakesSaved}
                onClick={async () => {
                  await onSaveMistakes(
                    wrongItems.map((w) => w.question),
                    wrongItems.map((w) => w.answer),
                  );
                  setMistakesSaved(true);
                }}
              >
                {mistakesSaved ? t('quiz.mistakesSaved') : t('quiz.saveMistakes', { count: wrongItems.length })}
              </Button>
            )}
            <Button variant="ink" onClick={onClose} disabled={saving}>
              {t('actions.close')}
            </Button>
          </div>
        </div>
      ) : (
        q && (
          <div onKeyDown={onKey}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13.5px] font-semibold text-muted-foreground" aria-live="polite">
                {t('quiz.position', { current: index + 1, total: questions.length })} · {t('quiz.answered', { count: answered })}
              </p>
              {q.topic && <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12.5px] font-semibold text-accent-ink">{q.topic}</span>}
            </div>

            <nav aria-label={t('quiz.navigator')} className="scrollbar-thin -mx-1 mb-5 flex gap-1.5 relative overflow-x-auto px-1 pb-1">
              {questions.map((item, i) => {
                const done = answers[i] !== null && answers[i] !== undefined;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === index ? 'step' : undefined}
                    aria-label={t('quiz.goTo', { number: i + 1 }) + (done ? ` (${t('quiz.answeredShort')})` : '') + (flags[i] ? ` (${t('quiz.flagged')})` : '')}
                    className={clsx(
                      'relative flex h-9 min-w-9 items-center justify-center rounded-[10px] px-2 text-[13px] font-semibold tabular-nums transition-colors',
                      i === index ? 'bg-primary text-primary-foreground' : done ? 'bg-accent-soft text-accent-ink' : 'bg-surface-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {i + 1}
                    {flags[i] && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-achievement ring-2 ring-surface" />}
                  </button>
                );
              })}
            </nav>

            <fieldset>
              <legend id={`${groupId}-stem`} className="whitespace-pre-line font-display text-[19px] font-bold leading-snug text-foreground">
                <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                {q.stem}
              </legend>
              <div className="mt-4 grid gap-2.5">
                {q.options.map((option, i) => {
                  const selected = answers[index] === i;
                  const showCorrect = isChecked && i === q.answer;
                  const showWrong = isChecked && selected && i !== q.answer;
                  return (
                    <label
                      key={i}
                      className={clsx(
                        'flex cursor-pointer items-center gap-3 rounded-[14px] border-2 px-4 py-3 text-[15px] transition-colors',
                        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                        showCorrect ? 'border-success bg-success/[0.08]' : showWrong ? 'border-danger bg-danger/[0.06]' : selected ? 'border-primary bg-accent-soft' : 'border-border bg-surface hover:border-primary/40',
                        isChecked && 'cursor-default',
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={`${groupId}-q${index}`}
                        checked={selected}
                        onChange={() => choose(i)}
                        disabled={isChecked}
                      />
                      <span
                        aria-hidden
                        className={clsx(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-bold',
                          showCorrect ? 'bg-success text-white' : showWrong ? 'bg-danger text-white' : selected ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-foreground',
                        )}
                      >
                        {LETTERS[i]}
                      </span>
                      <span className="flex-1 text-foreground">{option}</span>
                      {showCorrect && <CheckCircle2 className="h-5 w-5 text-success" aria-label={t('quiz.correctAnswer')} />}
                      {showWrong && <XCircle className="h-5 w-5 text-danger" aria-label={t('quiz.wrong')} />}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {isChecked && (
              <div role="status" className={clsx('mt-4 rounded-[14px] p-4 text-[14px]', answers[index] === q.answer ? 'bg-success/[0.08] text-foreground' : 'bg-danger/[0.06] text-foreground')}>
                <p className="font-semibold">
                  {answers[index] === q.answer ? t('quiz.feedbackCorrect') : t('quiz.feedbackWrong', { answer: q.answer === undefined ? '—' : `${LETTERS[q.answer]}) ${q.options[q.answer]}` })}
                </p>
                {q.explanation && <p className="mt-1 text-muted-foreground">{q.explanation}</p>}
              </div>
            )}

            {(saving || submitError !== null || timeUp) && !result && (
              <div role={submitError ? 'alert' : 'status'} className={clsx('mt-4 rounded-[14px] p-4 text-[14px]', submitError ? 'border border-danger/30 bg-danger/[0.06]' : 'bg-accent-soft text-accent-ink')}>
                {submitError ? (
                  <>
                    <p className="font-semibold text-foreground">{t('quiz.submitFailed')}</p>
                    <p className="mt-1 text-muted-foreground">{t(errorMessageKey(submitError))}</p>
                    <Button className="mt-3" size="sm" variant="ink" onClick={() => void finish()}>
                      {t('actions.retry')}
                    </Button>
                  </>
                ) : (
                  <p className="font-semibold">{saving ? t('quiz.submitting') : t('quiz.timeUp')}</p>
                )}
              </div>
            )}

            {confirming && (
              <div role="alertdialog" aria-labelledby={`${groupId}-confirm`} className="mt-4 rounded-[14px] border border-warning/40 bg-warning/[0.08] p-4">
                <p id={`${groupId}-confirm`} className="text-[14.5px] font-semibold text-foreground">
                  {t('quiz.confirmFinish', { count: questions.length - answered })}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="ink" onClick={() => void finish()}>
                    {t('quiz.finishNow')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
                    {t('quiz.keepGoing')}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0} icon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
                  {t('actions.previous')}
                </Button>
                {mode === 'exam' && (
                  <Button
                    variant="ghost"
                    aria-pressed={flags[index]}
                    onClick={() => setFlags((prev) => prev.map((f, i) => (i === index ? !f : f)))}
                    icon={<Flag className={clsx('h-4 w-4', flags[index] && 'fill-achievement text-achievement')} aria-hidden />}
                  >
                    {t('quiz.flag')}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {mode === 'practice' && !checked[index] ? (
                  <Button variant="primary" disabled={answers[index] === null} onClick={() => setChecked((prev) => prev.map((c, i) => (i === index ? true : c)))}>
                    {t('quiz.check')}
                  </Button>
                ) : index < questions.length - 1 ? (
                  <Button variant="primary" onClick={() => go(index + 1)} iconEnd={<ArrowRight className="h-4 w-4" aria-hidden />}>
                    {t('actions.next')}
                  </Button>
                ) : null}
                {(index === questions.length - 1 || mode === 'exam') && (
                  <Button
                    variant="ink"
                    loading={saving}
                    onClick={() => (answered < questions.length && !timeUp ? setConfirming(true) : void finish())}
                    disabled={(mode === 'practice' && !checked[index]) || saving}
                  >
                    {t('quiz.finish')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </Modal>
  );
}

function ResultTile({ icon: Icon, tone, label, value }: { icon: typeof CheckCircle2; tone: string; label: string; value: number }) {
  return (
    <div className="rounded-[14px] border border-border bg-surface px-3 py-2.5 text-center">
      <Icon className={clsx('mx-auto h-5 w-5', tone)} aria-hidden />
      <p className="mt-1 font-display text-[22px] font-extrabold text-foreground">{value}</p>
      <p className="text-[12.5px] text-muted-foreground">{label}</p>
    </div>
  );
}
