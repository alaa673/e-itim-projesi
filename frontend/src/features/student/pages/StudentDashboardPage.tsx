import clsx from 'clsx';
import { ArrowRight, ArrowUpRight, CalendarCheck2, CalendarDays, Check, Goal, Target, UsersRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import bannerStudent from '@/assets/illustrations/banner-student.webp';
import goalFlag from '@/assets/illustrations/goal-flag.webp';
import supportBook from '@/assets/illustrations/support-book.webp';
import { HandArrow } from '@/components/brand/Sparkle';
import { HeroBanner } from '@/components/dashboard/HeroBanner';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Panel } from '@/components/ui/Panel';
import { AsyncContent, Skeleton } from '@/components/ui/States';
import { useAuth } from '@/app/providers/authContext';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { daysFromToday, formatDate, formatTime } from '@/utils/format';
import { CourseCard } from '../components/CourseCard';
import { studentPortalService } from '../services/studentPortalService';
import { subjectIcon } from '../subjectIcon';
import type { PlanItem, StudentHomeData } from '../types';

const PLAN_STYLE: Record<PlanItem['kind'], { row: string; tile: string; chip: string; cta: 'ink' | 'secondary'; to: string }> = {
  exam: { row: 'bg-tint-violet', tile: 'bg-surface text-ink-violet', chip: 'bg-primary/[0.12] text-accent-ink', cta: 'ink', to: '/student/exams' },
  homework: { row: 'bg-tint-mint', tile: 'bg-surface text-ink-mint', chip: 'bg-achievement-soft text-achievement-ink', cta: 'secondary', to: '/student/assignments' },
  meeting: { row: 'bg-tint-sky', tile: 'bg-surface text-ink-sky', chip: 'bg-info/[0.12] text-info', cta: 'secondary', to: '/student/meetings' },
};

function DashboardSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]" aria-hidden>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-[300px] rounded-panel" />
        <Skeleton className="h-[300px] rounded-panel" />
      </div>
      <Skeleton className="h-[340px] rounded-panel" />
      <Skeleton className="h-[190px] rounded-panel" />
      <Skeleton className="h-[190px] rounded-panel" />
    </div>
  );
}

export default function StudentDashboardPage() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync((signal) => studentPortalService.getDashboard(locale, signal), [locale]);
  const firstName = user?.firstName ?? '';
  const continueTo = data?.courses[0] ? `/student/lessons?open=${data.courses[0].id}` : '/student/lessons';

  return (
    <>
      <HeroBanner
        greeting={t('dashboard.greeting', { name: firstName })}
        lead={t('dashboard.lead')}
        title={
          <>
            {t('dashboard.title1')}
            <br />
            {t('dashboard.title2')}
          </>
        }
        illustration={bannerStudent}
        illustrationClassName="w-[50%]"
        note={
          <>
            {t('dashboard.note1')}
            <br />
            <span className="ml-3">{t('dashboard.note2')}</span>
            <br />
            <span className="ml-6">{t('dashboard.note3')}</span>
            <br />
            <span className="ml-9">{t('dashboard.note4')}</span>
          </>
        }
        noteClassName="left-[46%] top-8"
        actions={
          <Link to={continueTo} className={buttonClass('ink', 'lg')}>
            {t('dashboard.continueLearning')}
            <ArrowUpRight className="h-5 w-5" aria-hidden />
          </Link>
        }
      />

      <AsyncContent data={data} error={error} loading={loading} reload={reload} skeleton={<DashboardSkeleton />}>
        {(d) => <DashboardBody d={d} />}
      </AsyncContent>
    </>
  );
}

function DashboardBody({ d }: { d: StudentHomeData }) {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const today = formatDate(new Date(), locale, { day: 'numeric', month: 'long', weekday: 'long' });
  const remaining = Math.max(0, d.weeklyGoal.target - d.weeklyGoal.done);

  const chipText = (item: PlanItem) => {
    if (item.kind === 'exam') return t('common.questions', { ns: 'common', count: item.questionCount ?? 0 });
    if (item.kind === 'meeting') return formatTime(item.at, locale);
    const days = daysFromToday(item.at);
    if (days === 0) return t('time.today', { ns: 'common' });
    if (days === 1) return t('time.tomorrow', { ns: 'common' });
    return formatDate(item.at, locale, { day: 'numeric', month: 'short' });
  };
  const ctaText = (item: PlanItem) => t(item.kind === 'exam' ? 'actions.start' : item.kind === 'meeting' ? 'actions.join' : 'actions.details', { ns: 'common' });

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section aria-labelledby="route-title">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 id="route-title" className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-foreground sm:text-[26px]">
              {t('dashboard.route.title')}
            </h2>
            <Link to="/student/lessons" className="link-accent">
              {t('dashboard.route.all')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {d.courses.map((course, i) => (
              <CourseCard key={course.id} subject={course} ctaLabel={i === 0 ? t('dashboard.course.back') : t('actions.explore', { ns: 'common' })} />
            ))}
          </div>
        </section>

        <Panel
          icon={CalendarCheck2}
          title={t('dashboard.plan.title')}
          action={
            <span className="inline-flex items-center gap-2 text-[13.5px] text-muted-foreground">
              <CalendarDays className="h-4 w-4" aria-hidden />
              {today}
            </span>
          }
        >
          {d.plan.length === 0 ? (
            <p className="rounded-[16px] bg-surface-muted px-4 py-6 text-center text-[14.5px] text-muted-foreground">{t('dashboard.plan.empty')}</p>
          ) : (
            <ul className="space-y-3">
              {d.plan.map((item) => {
                const style = PLAN_STYLE[item.kind];
                const Icon = item.kind === 'meeting' ? UsersRound : subjectIcon(item.subject);
                return (
                  <li key={item.id} className={clsx('flex items-center gap-3 rounded-[16px] px-3 py-3 sm:px-4', style.row)}>
                    <span className={clsx('icon-tile h-11 w-11 rounded-[12px]', style.tile)}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold text-foreground">{item.title}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">{item.detail}</span>
                    </span>
                    <span className={clsx('hidden shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold tabular-nums sm:inline-block', style.chip)}>
                      <span className="sr-only">{t(`dashboard.plan.chip.${item.kind}`)}: </span>
                      {chipText(item)}
                    </span>
                    <Link to={`${style.to}?open=${item.id}`} className={buttonClass(style.cta, 'sm', 'shrink-0')}>
                      {ctaText(item)}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                      <span className="sr-only">: {item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {d.examPrep && (
            <Link to="/student/mock-exams" className="group mt-4 flex items-center gap-3 border-t border-border pt-4">
              <span className="icon-tile h-11 w-11 rounded-full bg-tint-violet text-ink-violet">
                <Target className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-foreground">{t('dashboard.examPrep.title', { exam: d.examPrep })}</span>
                <span className="block truncate text-[13px] text-muted-foreground">{t('dashboard.examPrep.body')}</span>
              </span>
              <span className="link-accent">
                {t('actions.explore', { ns: 'common' })}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Panel
          icon={UsersRound}
          title={t('dashboard.support.title')}
          description={d.support ? t('dashboard.support.lead', { topic: d.support.topic, teacher: d.support.teacher }) : t('dashboard.support.noneLead')}
        >
          {d.support ? (
            <div className="flex flex-col gap-4 rounded-[18px] bg-surface-muted p-4 sm:flex-row sm:items-center sm:p-5">
              <img
                src={supportBook}
                alt=""
                aria-hidden
                decoding="async"
                className="h-[92px] w-[142px] shrink-0 select-none object-contain drop-shadow-[0_10px_14px_rgb(76_40_160/0.22)]"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-[17px] font-extrabold text-foreground">
                  {d.support.includesSummary
                    ? t('dashboard.support.withSummary', { count: d.support.questionCount })
                    : t('common.questions', { ns: 'common', count: d.support.questionCount })}
                </p>
                <p className="mt-1 text-[14px] leading-snug text-muted-foreground">{t('dashboard.support.body', { topic: d.support.topic })}</p>
              </div>
              <Link to={`/student/support?open=${d.support.id}`} className={buttonClass('ink', 'md', 'self-start sm:self-center')}>
                {t('dashboard.support.open')}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-[18px] bg-surface-muted p-5 sm:flex-row sm:items-center">
              <p className="flex-1 text-[14.5px] text-muted-foreground">{t('dashboard.support.none')}</p>
              <Link to="/student/mistakes" className={buttonClass('soft', 'md')}>
                {t('dashboard.support.toMistakes')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}
        </Panel>

        <section aria-labelledby="goal-title" className="goal-card min-h-[200px] p-5 sm:p-6">
          <img
            src={goalFlag}
            alt=""
            aria-hidden
            decoding="async"
            className="pointer-events-none absolute -bottom-2 right-0 h-[86%] w-auto select-none object-contain [mask-image:linear-gradient(90deg,transparent_0%,rgb(0_0_0/0.55)_30%,black_62%)]"
          />
          <div className="relative flex items-center justify-between gap-3">
            <h2 id="goal-title" className="flex items-center gap-2.5 font-display text-[19px] font-extrabold">
              <Goal className="h-6 w-6" aria-hidden />
              {t('dashboard.goal.title')}
            </h2>
            <Link to="/student/goals" className="relative inline-flex items-center gap-1 text-[14px] font-semibold underline-offset-4 hover:underline">
              {t('actions.details', { ns: 'common' })}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="relative mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 sm:max-w-[80%]">
            <p>
              <span className="font-display text-[60px] font-extrabold leading-[0.9] tracking-[-0.04em]">{d.weeklyGoal.done}</span>
              <span className="font-display text-[34px] font-extrabold"> / {d.weeklyGoal.target}</span>
              <span className="mt-1 block text-[14px] font-semibold">{t('dashboard.goal.done')}</span>
            </p>
            <ol className="flex gap-1.5 sm:mb-5" aria-label={t('dashboard.goal.aria', { done: d.weeklyGoal.done, total: d.weeklyGoal.target })}>
              {Array.from({ length: d.weeklyGoal.target }, (_, i) => (
                <li
                  key={i}
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-[10px]',
                    i < d.weeklyGoal.done ? 'bg-[#6a9f1c] text-white shadow-[0_6px_12px_-8px_#3d6a07]' : 'bg-white/70',
                  )}
                >
                  {i < d.weeklyGoal.done && <Check className="h-5 w-5" strokeWidth={3} aria-hidden />}
                </li>
              ))}
            </ol>
          </div>
          <p className="hand relative mt-2 -rotate-3 text-[22px] leading-none text-[#1d1433]/85 sm:ml-24">
            <HandArrow className="mr-1 inline h-5 w-12 -scale-x-100 text-[#1d1433]/70" />
            {remaining > 0 ? t('dashboard.goal.remaining', { count: remaining }) : t('dashboard.goal.complete')}
          </p>
        </section>
      </div>
    </>
  );
}
