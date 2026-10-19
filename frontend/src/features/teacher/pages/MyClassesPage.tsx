import clsx from 'clsx';
import { AlertTriangle, ArrowRight, BarChart3, ChevronRight, Megaphone, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Meter } from '@/components/charts/Meter';
import { scoreTone } from '@/components/charts/scoreTone';
import { TopicBars } from '@/components/charts/TopicBars';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Modal } from '@/components/ui/Modal';
import { AsyncContent, Skeleton } from '@/components/ui/States';
import { TOPIC_REVIEW_THRESHOLD } from '@/config/constants';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { formatDate, formatPercent } from '@/utils/format';
import { classInsightApi, studentInsightApi, type TeacherClassRow } from '../services/teacherApi';

export default function MyClassesPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const locale = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync((signal) => classInsightApi.list(signal), []);
  const [open, setOpen] = useState<TeacherClassRow | null>(null);

  // Dashboard class cards link here with { open: '8-A' }.
  useEffect(() => {
    const name = (location.state as { open?: string } | null)?.open;
    if (name && data) {
      setOpen(data.find((c) => c.name === name) ?? null);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, data, navigate]);

  return (
    <>
      <PageHeader title={t('nav.teacher.myClasses', { ns: 'common' })} description={t('classes.description')} />
      <AsyncContent
        data={data}
        error={error}
        loading={loading}
        reload={reload}
        skeleton={
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[230px] rounded-panel" />
            ))}
          </div>
        }
      >
        {(classes) => (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classes.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setOpen(c)} className="panel card-interactive group flex h-full w-full flex-col p-5 text-left">
                  <span className="flex items-center gap-3">
                    <span className="icon-tile h-12 w-12 bg-tint-violet text-ink-violet">
                      <UsersRound className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[22px] font-extrabold leading-tight text-foreground">{c.name}</span>
                      <span className="block text-[13.5px] text-muted-foreground">
                        {c.subject} · {t('common.students', { ns: 'common', count: c.studentCount })}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-foreground/60 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  <span className="mt-4 flex items-center gap-3">
                    <span className="text-[13px] text-muted-foreground">{t('classes.average')}</span>
                    <Meter className="flex-1" value={c.average} tone="score" label={`${c.name} ${t('classes.average')}`} />
                    <span className="w-10 text-right text-[14px] font-semibold tabular-nums text-foreground">{formatPercent(c.average, locale)}</span>
                  </span>
                  <span className="mt-4 flex flex-wrap gap-1.5">
                    {c.topics.slice(0, 2).map((tp) => (
                      <Badge key={tp.name} tone={tp.percent < TOPIC_REVIEW_THRESHOLD ? 'danger' : 'warning'}>
                        {tp.name} · {formatPercent(tp.percent, locale)}
                      </Badge>
                    ))}
                  </span>
                  <span className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-[13px]">
                    <span className="text-muted-foreground">
                      {c.lastExam ? `${c.lastExam.title} · ${formatDate(c.lastExam.date, locale, { day: 'numeric', month: 'short' })}` : t('classes.noExam')}
                    </span>
                    {c.needsSupport > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-danger">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                        {t('classes.needsSupport', { count: c.needsSupport })}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </AsyncContent>
      <ClassPanel cls={open} onClose={() => setOpen(null)} />
    </>
  );
}

function ClassPanel({ cls, onClose }: { cls: TeacherClassRow | null; onClose: () => void }) {
  const { t } = useTranslation(['teacher', 'common']);
  const locale = useLocale();
  const students = useAsync(
    (signal) => (cls ? studentInsightApi.list({ offset: 0, limit: 60, filters: { className: cls.name }, sortKey: 'average' }, signal) : Promise.resolve(null)),
    [cls?.name],
  );
  return (
    <Modal open={cls !== null} onClose={onClose} variant="side" size="lg" title={cls ? t('classes.panelTitle', { name: cls.name }) : ''} description={cls ? `${cls.subject} · ${t('common.students', { ns: 'common', count: cls.studentCount })}` : undefined}>
      {cls && (
        <>
          <div className="flex flex-wrap gap-2">
            {cls.lastExam?.id && (
              <Link to={`/teacher/results?exam=${cls.lastExam.id}`} className={buttonClass('soft', 'sm')}>
                <BarChart3 className="h-4 w-4" aria-hidden />
                {t('classes.openResults')}
              </Link>
            )}
            <Link to="/teacher/announcements" state={{ openCreate: true }} className={buttonClass('secondary', 'sm')}>
              <Megaphone className="h-4 w-4" aria-hidden />
              {t('classes.announce')}
            </Link>
            <Link to={`/teacher/reports?class=${cls.name}`} className={buttonClass('secondary', 'sm')}>
              {t('classes.report')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <h3 className="mt-6 font-display text-[16px] font-extrabold text-foreground">{t('classes.topics')}</h3>
          <div className="mt-3">
            <TopicBars
              data={cls.topics.map((tp) => ({ id: tp.name, label: tp.name, percent: tp.percent }))}
              threshold={TOPIC_REVIEW_THRESHOLD}
              thresholdLabel={t('classes.threshold', { value: TOPIC_REVIEW_THRESHOLD })}
              reviewLabel={t('classes.review')}
            />
          </div>
          <h3 className="mt-6 font-display text-[16px] font-extrabold text-foreground">{t('classes.studentsTitle')}</h3>
          <p className="text-[13px] text-muted-foreground">{t('classes.studentsHint')}</p>
          <AsyncContent data={students.data} error={students.error} loading={students.loading} reload={students.reload} skeleton={<Skeleton className="mt-3 h-48 rounded-[14px]" />}>
            {(page) => (
              <ul className="mt-3 divide-y divide-border rounded-[14px] border border-border">
                {page.items.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Avatar name={s.name} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-semibold text-foreground">{s.name}</span>
                      <span className="block truncate text-[12.5px] text-muted-foreground">{s.weakTopic ? t('classes.weakest', { topic: s.weakTopic.name, value: formatPercent(s.weakTopic.percent, locale) }) : '—'}</span>
                    </span>
                    <span className={clsx('w-12 text-right text-[14px] font-semibold tabular-nums', scoreTone(s.average) === 'danger' ? 'text-danger' : 'text-foreground')}>{formatPercent(s.average, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </AsyncContent>
          <Link to={`/teacher/students?class=${cls.name}`} className={buttonClass('ghost', 'sm', 'mt-3')}>
            {t('classes.allStudents')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </>
      )}
    </Modal>
  );
}
