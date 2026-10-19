import clsx from 'clsx';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  MoreVertical,
  NotebookText,
  Send,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import bannerTeacher from '@/assets/illustrations/banner-teacher.webp';
import { Meter } from '@/components/charts/Meter';
import { scoreTone } from '@/components/charts/scoreTone';
import { HeroBanner } from '@/components/dashboard/HeroBanner';
import { StatTile } from '@/components/dashboard/StatTile';
import { Avatar } from '@/components/ui/Avatar';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Panel } from '@/components/ui/Panel';
import { AsyncContent } from '@/components/ui/States';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { formatDate, formatNumber, formatPercent, formatTimeRange } from '@/utils/format';
import { type SupportTarget, SupportExerciseModal } from '../components/SupportExerciseModal';
import { teacherService } from '../services/teacherService';

const DOT: Record<string, string> = { lesson: 'bg-primary', exam: 'bg-lime-ink', meeting: 'bg-achievement', homework: 'bg-info', activity: 'bg-chart-4', other: 'bg-muted-foreground' };

export default function TeacherDashboardPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const locale = useLocale();
  const { data, error, loading, reload } = useAsync((signal) => teacherService.getDashboard(locale, signal), [locale]);
  const [supportTarget, setSupportTarget] = useState<SupportTarget | null>(null);
  const today = formatDate(new Date(), locale, { day: 'numeric', month: 'long', weekday: 'long' });

  return (
    <>
      <HeroBanner
        eyebrow={t('dashboard.eyebrow')}
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        illustration={bannerTeacher}
        illustrationClassName="w-[44%]"
        note={
          <>
            {t('dashboard.note1')}
            <br />
            {t('dashboard.note2')}
          </>
        }
        noteClassName="right-8 top-6"
        actions={
          <>
            <Link to="/teacher/lessons" state={{ openUpload: true }} className={buttonClass('ink', 'lg')}>
              <FileText className="h-5 w-5" aria-hidden />
              {t('dashboard.pdfSummary')}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link to="/teacher/questions" state={{ openGenerate: true }} className={buttonClass('inverse', 'lg', 'text-accent-ink')}>
              <Sparkles className="h-5 w-5" aria-hidden />
              {t('dashboard.prepareQuestions')}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </>
        }
      />

      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(d) => (
          <>
            <section aria-label={t('dashboard.statsLabel')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile tone="violet" icon={UsersRound} label={t('dashboard.stats.classes')} value={d.stats.classes} to="/teacher/classes" />
              <StatTile tone="mint" icon={UsersRound} label={t('dashboard.stats.students')} value={formatNumber(d.stats.students, locale)} to="/teacher/students" />
              <StatTile tone="peach" icon={ClipboardList} label={t('dashboard.stats.activeExams')} value={d.stats.activeExams} to="/teacher/exams" />
              <StatTile tone="sky" icon={Clock3} label={t('dashboard.stats.pendingReviews')} value={d.stats.pendingReviews} to="/teacher/grading" />
            </section>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <Panel
                id="needs-support"
                icon={UsersRound}
                title={t('dashboard.needsSupport.title')}
                action={
                  <Link to="/teacher/support" className="link-accent">
                    {t('actions.viewAll', { ns: 'common' })}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                }
                bodyClassName="px-0 pb-3 sm:px-0"
              >
                <div className="relative overflow-x-auto px-5 sm:px-6">
                  <table className="w-full min-w-[620px] text-left text-[14.5px]">
                    <caption className="sr-only">{t('dashboard.needsSupport.title')}</caption>
                    <thead>
                      <tr className="bg-surface-muted text-[13.5px] text-muted-foreground">
                        <th scope="col" className="rounded-l-[12px] px-4 py-3 font-semibold">{t('common.student', { ns: 'common' })}</th>
                        <th scope="col" className="px-3 py-3 font-semibold">{t('common.class', { ns: 'common' })}</th>
                        <th scope="col" className="px-3 py-3 font-semibold">{t('common.topic', { ns: 'common' })}</th>
                        <th scope="col" className="px-3 py-3 font-semibold">{t('common.success', { ns: 'common' })}</th>
                        <th scope="col" className="rounded-r-[12px] px-3 py-3 font-semibold">
                          <span className="sr-only">{t('common.actions', { ns: 'common' })}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.needsSupport.slice(0, 4).map((s) => (
                        <tr key={`${s.studentId}-${s.topicId}`} className="border-b border-border last:border-0">
                          <th scope="row" className="px-4 py-3 font-semibold text-foreground">
                            <span className="flex items-center gap-3">
                              <Avatar name={s.studentName} size={40} />
                              {s.studentName}
                            </span>
                          </th>
                          <td className="px-3 py-3 text-foreground">{s.className}</td>
                          <td className="px-3 py-3 text-foreground">{s.topicName}</td>
                          <td className="px-3 py-3">
                            <span className="flex items-center gap-3">
                              <Meter className="w-24" value={s.percent} tone="score" label={`${s.studentName} · ${s.topicName}`} />
                              <span className={clsx('w-10 text-[14px] font-semibold tabular-nums', scoreTone(s.percent) === 'danger' ? 'text-danger' : 'text-foreground')}>
                                {formatPercent(s.percent, locale)}
                              </span>
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                className={buttonClass('soft', 'sm')}
                                aria-label={`${t('dashboard.needsSupport.send')}: ${s.studentName}, ${s.topicName}`}
                                onClick={() =>
                                  setSupportTarget({
                                    studentId: s.studentId,
                                    studentName: s.studentName,
                                    className: s.className,
                                    topics: [{ id: s.topicId, name: s.topicName, percent: s.percent }],
                                    initialTopicId: s.topicId,
                                  })
                                }
                              >
                                <Send className="h-3.5 w-3.5" aria-hidden />
                                {t('dashboard.needsSupport.send')}
                              </button>
                              <Link
                                to={`/teacher/results?exam=${s.examId}`}
                                className={buttonClass('ghost', 'icon-sm')}
                                aria-label={`${t('dashboard.needsSupport.viewResult')}: ${s.studentName}`}
                                title={t('dashboard.needsSupport.viewResult')}
                              >
                                <MoreVertical className="h-4 w-4" aria-hidden />
                              </Link>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel
                icon={CalendarDays}
                title={t('dashboard.schedule.title')}
                action={
                  <span className="inline-flex items-center gap-2 text-[14px] text-muted-foreground">
                    <CalendarDays className="h-4 w-4" aria-hidden />
                    {today}
                  </span>
                }
              >
                {d.schedule.length === 0 ? (
                  <p className="py-6 text-center text-[14.5px] text-muted-foreground">{t('dashboard.schedule.empty')}</p>
                ) : (
                  <ol className="relative">
                    {d.schedule.map((item, i) => (
                      <li key={item.id} className="relative flex gap-4 pb-1">
                        <span className="relative flex w-3 shrink-0 justify-center">
                          <span className={clsx('relative z-10 mt-5 h-3 w-3 rounded-full ring-4 ring-surface', DOT[item.kind])} aria-hidden />
                          {i < d.schedule.length - 1 && <span aria-hidden className="absolute bottom-0 top-8 w-px bg-border" />}
                        </span>
                        <Link to="/teacher/calendar" className="group flex min-w-0 flex-1 items-center gap-4 border-b border-border py-3.5 last:border-0">
                          <span className="w-[106px] shrink-0 text-[14px] tabular-nums text-muted-foreground">{formatTimeRange(item.start, item.end, locale)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-foreground">
                              {item.classLabel ? `${item.classLabel} • ` : ''}
                              {item.title.split(' — ')[0]}
                            </span>
                            {item.title.includes(' — ') && <span className="block truncate text-[13px] text-muted-foreground">{item.title.split(' — ')[1]}</span>}
                          </span>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent-ink transition-transform group-hover:translate-x-0.5">
                            <ChevronRight className="h-4 w-4" aria-hidden />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
                <Link to="/teacher/calendar" className={buttonClass('soft', 'md', 'mt-4 w-full')}>
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  {t('dashboard.schedule.viewAll')}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Panel>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <Panel
                icon={UsersRound}
                title={t('dashboard.classes.title')}
                action={
                  <Link to="/teacher/reports" className={buttonClass('soft', 'sm')}>
                    <Download className="h-4 w-4" aria-hidden />
                    {t('dashboard.classes.pdf')}
                  </Link>
                }
              >
                <ul className="grid gap-4 sm:grid-cols-2">
                  {d.classes.slice(0, 4).map((cls) => (
                    <li key={cls.id}>
                      <Link to="/teacher/classes" state={{ open: cls.name }} className="panel card-interactive group block p-4">
                        <span className="flex items-center gap-3">
                          <span className="icon-tile h-12 w-12 bg-tint-violet text-ink-violet">
                            <UsersRound className="h-5 w-5" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-display text-[20px] font-extrabold text-foreground">{cls.name}</span>
                            <span className="block text-[13.5px] text-muted-foreground">{t('common.students', { ns: 'common', count: cls.studentCount })}</span>
                          </span>
                          <ChevronRight className="h-5 w-5 text-foreground/70 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                        <span className="mt-4 flex items-center gap-3 border-t border-border pt-3">
                          <span className="text-[13.5px] text-foreground">{cls.subject}</span>
                          <Meter className="flex-1" value={cls.average} tone="success" label={`${cls.name} · ${cls.subject}`} />
                          <span className="text-[13.5px] font-semibold tabular-nums text-foreground">{formatPercent(cls.average, locale)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel
                icon={NotebookText}
                title={t('dashboard.latestExams.title')}
                action={
                  <Link to="/teacher/exams" className="link-accent">
                    {t('dashboard.latestExams.all')}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                }
              >
                {d.latestExam && (
                  <div className="flex flex-col gap-4 rounded-[18px] border border-border p-4 sm:flex-row sm:items-center">
                    <span className="icon-tile h-16 w-16 bg-tint-violet text-ink-violet">
                      <ClipboardList className="h-7 w-7" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[16.5px] font-extrabold text-foreground">
                        {d.latestExam.className} • {d.latestExam.title}
                      </p>
                      <p className="text-[13.5px] text-muted-foreground">
                        {t('dashboard.latestExams.completed', { done: d.latestExam.completed, total: d.latestExam.assigned })}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <Meter value={d.latestExam.average} tone="success" label={t('dashboard.latestExams.average')} />
                        <span className="text-[13.5px] font-semibold tabular-nums">{formatPercent(d.latestExam.average, locale)}</span>
                      </div>
                      <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                        {t('common.questions', { ns: 'common', count: d.latestExam.questionCount })} • {formatDate(d.latestExam.date, locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <Link to="/teacher/results" className={buttonClass('ink', 'md', 'self-start sm:self-center')}>
                      <BarChart3 className="h-4 w-4" aria-hidden />
                      {t('dashboard.latestExams.review')}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                )}
              </Panel>
            </div>
          </>
        )}
      </AsyncContent>

      <SupportExerciseModal target={supportTarget} onClose={() => setSupportTarget(null)} />
    </>
  );
}
