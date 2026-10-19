import clsx from 'clsx';
import { PencilRuler, PlayCircle, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { type QuizQuestion, QuizPlayer } from '@/components/quiz/QuizPlayer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { AsyncContent } from '@/components/ui/States';
import { TOPIC_REVIEW_THRESHOLD } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { formatPercent } from '@/utils/format';
import { subjectIcon } from '../subjectIcon';
import { practiceQuestions, saveMistakes, subjectApi } from '../services/studentApi';

export default function TopicPracticePage() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const [params] = useSearchParams();
  const subjects = useAsync((signal) => subjectApi.list(signal), []);
  const [subject, setSubject] = useState(params.get('subject') ?? '');
  const [topic, setTopic] = useState(params.get('topic') ?? '');
  const [count, setCount] = useState('10');
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const { run, busy } = useAction();

  useEffect(() => {
    if (!subject && subjects.data?.[0]) setSubject(subjects.data[0].name);
  }, [subjects.data, subject]);

  const current = subjects.data?.find((s) => s.name === subject);
  const topics = useMemo(() => current?.units.flatMap((u) => u.topics) ?? [], [current]);
  const weak = topics.filter((tp) => tp.score !== null && tp.score < TOPIC_REVIEW_THRESHOLD + 10).sort((a, b) => (a.score ?? 0) - (b.score ?? 0)).slice(0, 4);

  const start = async (topicName = topic) => {
    const qs = await run(() => practiceQuestions({ subject, topic: topicName || null, count: Number(count) }));
    if (qs) {
      setTopic(topicName);
      setQuiz(qs);
    }
  };

  return (
    <>
      <PageHeader title={t('nav.student.topicPractice', { ns: 'common' })} description={t('practice.description')} />
      <AsyncContent data={subjects.data} error={subjects.error} loading={subjects.loading} reload={subjects.reload}>
        {(list) => (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Panel icon={PencilRuler} title={t('practice.setup')}>
              <div className="space-y-5">
                <div>
                  <p className="field-label">{t('common.subject', { ns: 'common' })}</p>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('common.subject', { ns: 'common' })}>
                    {list.map((s) => {
                      const Icon = subjectIcon(s.name);
                      const active = s.name === subject;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => {
                            setSubject(s.name);
                            setTopic('');
                          }}
                          className={clsx('inline-flex items-center gap-2 rounded-[12px] border-2 px-3 py-2 text-[14px] font-semibold transition-colors', active ? 'border-primary bg-accent-soft text-accent-ink' : 'border-border text-foreground hover:border-primary/40')}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Select
                  label={t('common.topic', { ns: 'common' })}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholderOption={t('practice.mixed')}
                  options={topics.map((tp) => ({ value: tp.name, label: tp.score !== null ? `${tp.name} · ${formatPercent(tp.score, locale)}` : tp.name }))}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <SegmentedControl label={t('common.questionCount', { ns: 'common' })} value={count} onChange={setCount} options={['5', '10', '15'].map((v) => ({ value: v, label: v }))} />
                  <SegmentedControl
                    label={t('practice.mode')}
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: 'practice', label: t('practice.modes.practice') },
                      { value: 'exam', label: t('practice.modes.exam') },
                    ]}
                  />
                </div>
                <p className="text-[13px] text-muted-foreground">{t(`practice.modeHint.${mode}`)}</p>
                <Button variant="ink" size="lg" loading={busy} disabled={!subject} icon={<PlayCircle className="h-5 w-5" aria-hidden />} onClick={() => void start()}>
                  {t('practice.start')}
                </Button>
              </div>
            </Panel>
            <Panel icon={Sparkles} title={t('practice.suggested')} description={t('practice.suggestedHint')}>
              {weak.length === 0 ? (
                <p className="py-4 text-[14px] text-muted-foreground">{t('practice.noWeak')}</p>
              ) : (
                <ul className="space-y-2.5">
                  {weak.map((tp) => (
                    <li key={tp.id} className="flex items-center gap-3 rounded-[14px] border border-border px-4 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-foreground">{tp.name}</span>
                        <Badge tone={(tp.score ?? 0) < TOPIC_REVIEW_THRESHOLD ? 'danger' : 'warning'} className="mt-1">
                          {formatPercent(tp.score ?? 0, locale)}
                        </Badge>
                      </span>
                      <Button size="sm" variant="soft" disabled={busy} onClick={() => void start(tp.name)}>
                        {t('actions.start', { ns: 'common' })}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}
      </AsyncContent>
      <QuizPlayer
        open={quiz !== null}
        title={t('practice.quizTitle', { subject, topic: topic || t('practice.mixed') })}
        questions={quiz ?? []}
        mode={mode}
        durationMinutes={mode === 'exam' ? Math.ceil(Number(count) * 1.5) : undefined}
        onClose={() => setQuiz(null)}
        onSaveMistakes={async (qs, answers) => {
          await run(() => saveMistakes(qs, answers), { success: t('exams.mistakesSaved', { count: qs.length }) });
        }}
      />
    </>
  );
}
