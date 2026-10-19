import { ArrowRight, Clock3, History, PlayCircle, Target } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { DueLabel } from '@/components/layout/RelativeTime';
import { type QuizQuestion, QuizPlayer } from '@/components/quiz/QuizPlayer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/toastContext';
import { IS_MOCK_MODE } from '@/config/constants';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { formatNumber } from '@/utils/format';
import { availableMockApi, mockQuestions, saveMistakes, submitMock } from '../services/studentApi';
import type { AvailableMock, MockAttempt } from '../types';

export default function StudentMockExamsPage() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const { data, error, loading, reload } = useAsync((signal) => availableMockApi.list({ offset: 0, limit: 50 }, signal), []);
  const [confirm, setConfirm] = useState<AvailableMock | null>(null);
  const [running, setRunning] = useState<{ mock: AvailableMock; questions: QuizQuestion[] } | null>(null);
  const [attempt, setAttempt] = useState<MockAttempt | null>(null);
  const { run, busy } = useAction();
  const { notify } = useToast();

  const start = async (mock: AvailableMock) => {
    const questions = await run(() => mockQuestions(mock));
    if (questions) {
      setConfirm(null);
      setRunning({ mock, questions });
    }
  };

  return (
    <>
      <PageHeader
        title={t('nav.student.mockExams', { ns: 'common' })}
        description={t('mocks.description')}
        actions={
          <Link to="/student/mock-history" className={buttonClass('secondary')}>
            <History className="h-4 w-4" aria-hidden />
            {t('nav.student.mockHistory', { ns: 'common' })}
          </Link>
        }
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(page) =>
          page.items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<Target className="h-5 w-5" aria-hidden />} title={t('mocks.empty')} />
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {page.items.map((m) => (
                <li key={m.id} className="panel flex flex-col p-5">
                  <div className="flex items-start gap-3">
                    <span className="icon-tile h-12 w-12 bg-tint-peach font-display text-[13px] font-extrabold text-ink-peach">{m.examType}</span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-[17px] font-extrabold text-foreground">{m.title}</h2>
                      <p className="text-[13px] text-muted-foreground">{m.subjects.join(' · ')}</p>
                    </div>
                  </div>
                  <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-muted-foreground">
                    <span>{t('common.questions', { ns: 'common', count: m.questionCount })}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-4 w-4" aria-hidden />
                      {t('common.minutesShort', { ns: 'common', count: m.durationMinutes })}
                    </span>
                  </p>
                  {m.assignedBy && (
                    <p className="mt-2">
                      <Badge tone="accent">{t('mocks.assignedBy', { name: m.assignedBy })}</Badge>
                      {m.due && (
                        <span className="ml-2 text-[13px] text-muted-foreground">
                          {t('common.due', { ns: 'common' })}: <DueLabel iso={m.due} />
                        </span>
                      )}
                    </p>
                  )}
                  <div className="mt-auto flex justify-end pt-4">
                    <Button variant="ink" icon={<PlayCircle className="h-4 w-4" aria-hidden />} onClick={() => setConfirm(m)}>
                      {t('actions.start', { ns: 'common' })}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </AsyncContent>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        size="sm"
        title={confirm?.title ?? ''}
        footer={
          confirm && (
            <>
              <Button variant="secondary" onClick={() => setConfirm(null)}>
                {t('actions.cancel', { ns: 'common' })}
              </Button>
              <Button variant="ink" loading={busy} icon={<PlayCircle className="h-4 w-4" aria-hidden />} onClick={() => void start(confirm)}>
                {t('mocks.begin')}
              </Button>
            </>
          )
        }
      >
        {confirm && (
          <ul className="space-y-2 text-[14.5px] text-foreground">
            <li>• {t('mocks.rule1', { count: confirm.questionCount, minutes: confirm.durationMinutes })}</li>
            <li>• {t(confirm.examType === 'LGS' ? 'mocks.rule2Lgs' : 'mocks.rule2Yks')}</li>
            <li>• {t('mocks.rule3')}</li>
          </ul>
        )}
      </Modal>

      <QuizPlayer
        open={running !== null}
        title={running?.mock.title ?? ''}
        questions={running?.questions ?? []}
        mode="exam"
        durationMinutes={running?.mock.durationMinutes}
        netRule={running ? (running.mock.examType === 'LGS' ? 'LGS' : 'YKS') : null}
        onClose={() => setRunning(null)}
        submit={async (answers, seconds) => {
          if (!running) throw new Error('no mock');
          const res = await submitMock(running.mock, running.questions, answers, seconds);
          setAttempt(res.attempt);
          notify({ tone: 'success', title: t('mocks.saved'), description: IS_MOCK_MODE ? t('demo.notPersisted', { ns: 'common' }) : undefined });
          return res;
        }}
        onSaveMistakes={async (qs, answers) => {
          await run(() => saveMistakes(qs, answers), { success: t('exams.mistakesSaved', { count: qs.length }) });
        }}
      />

      <Modal open={attempt !== null && running === null} onClose={() => setAttempt(null)} size="sm" title={t('mocks.resultTitle')}>
        {attempt && (
          <div>
            <p className="font-display text-[34px] font-extrabold text-foreground">
              {formatNumber(attempt.net, locale, { maximumFractionDigits: 2 })} <span className="text-[16px] font-semibold text-muted-foreground">{t('mocks.net')}</span>
            </p>
            <p className="text-[14px] text-muted-foreground">{t('mocks.resultLine', { correct: attempt.correct, wrong: attempt.wrong, blank: attempt.blank })}</p>
            <p className="mt-3 text-[13px] text-muted-foreground">{t('mocks.scoreNote')}</p>
            <Link to="/student/mock-history" className={buttonClass('soft', 'md', 'mt-4')}>
              {t('mocks.toHistory')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </Modal>
    </>
  );
}
