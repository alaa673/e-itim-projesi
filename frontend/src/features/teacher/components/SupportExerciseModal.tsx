import { CalendarDays, FileText, ListChecks, Minus, Plus, Send } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { heatStyle } from '@/components/charts/scoreScale';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/toastContext';
import { IS_MOCK_MODE } from '@/config/constants';
import { useLocale } from '@/hooks/useLocale';
import type { Difficulty } from '@/types';
import { errorMessageKey } from '@/utils/errorHandling';
import { formatDate, formatPercent } from '@/utils/format';
import { teacherService } from '../services/teacherService';

export interface SupportTarget {
  studentId: string;
  studentName: string;
  className: string;
  topics: { id: string; name: string; percent: number | null }[];
  initialTopicId: string;
}

const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 30;

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * "Destek Alıştırması Gönder" flow from the spec: topic → difficulty → count → optional due date
 * → optional topic summary → preview → send.
 */
export function SupportExerciseModal({ target, onClose }: { target: SupportTarget | null; onClose: () => void }) {
  const { t } = useTranslation(['teacher', 'common']);
  const locale = useLocale();
  const { notify } = useToast();
  const countId = useId();

  const [step, setStep] = useState<'settings' | 'preview'>('settings');
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [count, setCount] = useState(10);
  const [dueDate, setDueDate] = useState('');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setStep('settings');
    setTopicId(target.initialTopicId);
    const pct = target.topics.find((tp) => tp.id === target.initialTopicId)?.percent ?? 50;
    setDifficulty(pct < 40 ? 'easy' : pct < 70 ? 'medium' : 'hard');
    setCount(10);
    setDueDate('');
    setIncludeSummary(true);
    setError(null);
  }, [target]);

  if (!target) return null;
  const topic = target.topics.find((tp) => tp.id === topicId) ?? target.topics[0];
  const dueInvalid = dueDate !== '' && dueDate < todayIso();

  const send = async () => {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      await teacherService.sendSupportExercise({
        studentId: target.studentId,
        topicId: topic.id,
        difficulty,
        questionCount: count,
        dueDate: dueDate || null,
        includeSummary,
        // Display context for the list of sent exercises (the server resolves these from the ids).
        studentName: target.studentName,
        className: target.className,
        topicName: topic.name,
        percent: topic.percent ?? null,
      });
      notify({
        tone: 'success',
        title: t('support.sent', { name: target.studentName }),
        description: IS_MOCK_MODE ? t('demo.notPersisted', { ns: 'common' }) : t('support.sentHint'),
      });
      onClose();
    } catch (err) {
      setError(t(errorMessageKey(err), { ns: 'common' }));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      preventClose={sending}
      title={t('support.title')}
      description={`${target.studentName} · ${target.className}`}
      footer={
        step === 'settings' ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button variant="primary" onClick={() => setStep('preview')} disabled={dueInvalid} icon={<ListChecks className="h-4 w-4" aria-hidden />}>
              {t('support.preview')}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setStep('settings')} disabled={sending}>
              {t('actions.back', { ns: 'common' })}
            </Button>
            <Button variant="primary" onClick={() => void send()} loading={sending} icon={<Send className="h-4 w-4" aria-hidden />}>
              {t('support.send')}
            </Button>
          </>
        )
      }
    >
      <ol className="mb-5 flex items-center gap-2 text-[12.5px] font-semibold" aria-label={t('support.stepsLabel')}>
        {(['settings', 'preview'] as const).map((s, i) => (
          <li key={s} className="flex items-center gap-2" aria-current={step === s ? 'step' : undefined}>
            {i > 0 && <span aria-hidden className="h-0.5 w-8 rounded-full bg-border" />}
            <span
              className={
                step === s
                  ? 'flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-solid to-primary-solid-2 text-primary-foreground shadow-[0_6px_14px_-6px_rgb(var(--primary-solid)/0.8)]'
                  : 'flex h-7 w-7 items-center justify-center rounded-full bg-foreground/[0.07] text-muted-foreground'
              }
            >
              {i + 1}
            </span>
            <span className={step === s ? 'text-foreground' : 'text-muted-foreground'}>{t(`support.steps.${s}`)}</span>
          </li>
        ))}
      </ol>

      {step === 'settings' ? (
        <div className="space-y-5">
          <Select
            label={t('support.topic')}
            value={topic.id}
            onChange={(e) => setTopicId(e.target.value)}
            options={target.topics.map((tp) => ({
              value: tp.id,
              label: tp.percent === null ? tp.name : `${tp.name} — ${formatPercent(tp.percent, locale)}`,
            }))}
          />
          <SegmentedControl
            label={t('support.difficulty')}
            value={difficulty}
            onChange={setDifficulty}
            options={(['easy', 'medium', 'hard'] as const).map((d) => ({ value: d, label: t(`difficulty.${d}`, { ns: 'common' }) }))}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={countId} className="field-label">
                {t('support.count')}
              </label>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="icon" onClick={() => setCount((c) => Math.max(MIN_QUESTIONS, c - 1))} disabled={count <= MIN_QUESTIONS} aria-label={t('support.decrease')}>
                  <Minus className="h-4 w-4" aria-hidden />
                </Button>
                <input
                  id={countId}
                  type="number"
                  inputMode="numeric"
                  min={MIN_QUESTIONS}
                  max={MAX_QUESTIONS}
                  value={count}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n)) setCount(Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, Math.round(n))));
                  }}
                  className="control w-20 text-center font-semibold tabular-nums"
                />
                <Button variant="secondary" size="icon" onClick={() => setCount((c) => Math.min(MAX_QUESTIONS, c + 1))} disabled={count >= MAX_QUESTIONS} aria-label={t('support.increase')}>
                  <Plus className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
            <Input
              type="date"
              label={t('support.dueDate')}
              hint={t('support.dueDateHint')}
              min={todayIso()}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              error={dueInvalid ? t('support.dueDatePast') : undefined}
            />
          </div>
          <div className="rounded-control border border-border bg-surface-muted p-4">
            <Checkbox
              label={t('support.includeSummary')}
              description={t('support.includeSummaryHint')}
              checked={includeSummary}
              onChange={(e) => setIncludeSummary(e.target.checked)}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-panel border border-border p-4">
            <p className="text-[15px] leading-relaxed text-foreground">
              {t('support.previewSentence', {
                name: target.studentName,
                topic: topic.name,
                count,
                difficulty: t(`difficulty.${difficulty}`, { ns: 'common' }).toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-GB'),
              })}
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">{t('support.currentScore')}</dt>
                <dd className="mt-1">
                  {topic.percent === null ? (
                    '—'
                  ) : (
                    <span className="inline-flex rounded-[6px] px-2 py-0.5 font-semibold tabular-nums" style={heatStyle(topic.percent)}>
                      {formatPercent(topic.percent, locale)}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('support.dueDate')}</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {dueDate ? formatDate(`${dueDate}T12:00:00`, locale, { day: 'numeric', month: 'long' }) : t('support.noDueDate')}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('support.summary')}</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {includeSummary ? t('support.summaryIncluded') : t('support.summaryNotIncluded')}
                </dd>
              </div>
            </dl>
          </div>
          <p className="text-[13.5px] text-muted-foreground">{t('support.selectionRule', { count })}</p>
          <p className="text-[13.5px] text-muted-foreground">{t('support.followUp')}</p>
          {error && (
            <p role="alert" className="rounded-control bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
