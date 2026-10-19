import clsx from 'clsx';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  FileUp,
  HelpCircle,
  ListChecks,
  ListOrdered,
  Pencil,
  Settings2,
  Split,
  Tags,
  UserCog,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import bannerAdmin from '@/assets/illustrations/banner-admin.webp';
import { Meter } from '@/components/charts/Meter';
import { HeroBanner } from '@/components/dashboard/HeroBanner';
import { StatTile } from '@/components/dashboard/StatTile';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { AsyncContent } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import type { SchoolLevel } from '@/types';
import { formatDate, formatNumber, formatPercent } from '@/utils/format';
import { adminDashboardService } from '../services/adminDashboardService';

const PIPELINE = [
  { key: 'scan', icon: FileText },
  { key: 'split', icon: Split },
  { key: 'classify', icon: Tags },
  { key: 'approve', icon: CheckCircle2 },
] as const;

export default function AdminDashboardPage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const [tab, setTab] = useState<'students' | 'teachers'>('students');
  const [level, setLevel] = useState<SchoolLevel | ''>('');
  const { data, error, loading, reload } = useAsync((signal) => adminDashboardService.get(level, signal), [level]);

  return (
    <>
      <HeroBanner
        size="md"
        eyebrow={t('dashboard.eyebrow')}
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        illustration={bannerAdmin}
        illustrationClassName="w-[52%] [mask-image:linear-gradient(90deg,transparent_0%,black_16%)]"
      />

      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(d) => (
          <>
            <section aria-label={t('dashboard.statsLabel')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile variant="plain" tone="violet" icon={UserRound} label={t('dashboard.stats.students')} value={formatNumber(d.stats.students, locale)} to="/admin/students"
                delta={{ value: formatPercent(d.stats.deltas.students, locale), up: true, label: t('dashboard.vsLastMonth') }} />
              <StatTile variant="plain" tone="violet" icon={UserCog} label={t('dashboard.stats.teachers')} value={formatNumber(d.stats.teachers, locale)} to="/admin/teachers"
                delta={{ value: formatPercent(d.stats.deltas.teachers, locale), up: true, label: t('dashboard.vsLastMonth') }} />
              <StatTile variant="plain" tone="violet" icon={UsersRound} label={t('dashboard.stats.classes')} value={formatNumber(d.stats.classes, locale)} to="/admin/classes"
                delta={{ value: formatPercent(d.stats.deltas.classes, locale), up: true, label: t('dashboard.vsLastMonth') }} />
              <StatTile variant="plain" tone="violet" icon={FileText} label={t('dashboard.stats.pendingQuestions')} value={formatNumber(d.stats.pendingQuestions, locale)} to="/admin/exam-archive/review"
                delta={{ value: formatPercent(d.stats.deltas.pendingQuestions, locale), up: true, label: t('dashboard.vsLastMonth') }} />
            </section>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
              <Panel
                icon={Users}
                title={t('dashboard.users.title')}
                action={
                  <Select
                    label={t('common.level', { ns: 'common' })}
                    hideLabel
                    containerClassName="w-[190px]"
                    value={level}
                    highlight={Boolean(level)}
                    onChange={(e) => setLevel(e.target.value as SchoolLevel | '')}
                    placeholderOption={t('dashboard.users.allLevels')}
                    options={(['primary', 'middle', 'high'] as const).map((v) => ({ value: v, label: t(`levels.${v}`, { ns: 'common' }) }))}
                  />
                }
                bodyClassName="px-0 pb-0 sm:px-0"
              >
                <div className="px-5 sm:px-6">
                  <Tabs
                    label={t('dashboard.users.title')}
                    value={tab}
                    onChange={setTab}
                    items={[
                      { value: 'students', label: t('dashboard.users.students') },
                      { value: 'teachers', label: t('dashboard.users.teachers') },
                    ]}
                  />
                </div>
                <div className="relative overflow-x-auto px-5 pt-3 sm:px-6">
                  <table className="w-full text-left text-[14.5px]">
                    <caption className="sr-only">{t(`dashboard.users.${tab}`)}</caption>
                    <thead>
                      <tr className="bg-surface-muted text-[13.5px] text-muted-foreground">
                        <th scope="col" className="rounded-l-[12px] px-4 py-3 font-semibold">{t('dashboard.users.name')}</th>
                        <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">{tab === 'students' ? t('common.level', { ns: 'common' }) : t('dashboard.users.branch')}</th>
                        <th scope="col" className="px-4 py-3 font-semibold">{tab === 'students' ? t('common.class', { ns: 'common' }) : t('common.email', { ns: 'common' })}</th>
                        <th scope="col" className="px-4 py-3 font-semibold">{t('common.status', { ns: 'common' })}</th>
                        <th scope="col" className="rounded-r-[12px] px-4 py-3 text-right font-semibold">{t('common.actions', { ns: 'common' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(tab === 'students' ? d.students : d.teachers).map((p) => {
                        const name = `${p.firstName} ${p.lastName}`;
                        const isStudent = 'grade' in p;
                        return (
                          <tr key={p.id} className="border-b border-border last:border-0">
                            <th scope="row" className="px-4 py-3.5 font-semibold text-foreground">
                              <span className="flex items-center gap-3">
                                <Avatar name={name} size={36} />
                                {name}
                              </span>
                            </th>
                            <td className="hidden px-4 py-3.5 text-foreground sm:table-cell">{isStudent ? t(`levels.${p.level}`, { ns: 'common' }) : p.branch}</td>
                            <td className="px-4 py-3.5 text-foreground">
                              {isStudent ? `${p.grade}-${p.section}` : <span className="text-[13.5px] text-muted-foreground">{p.email}</span>}
                            </td>
                            <td className="px-4 py-3.5">
                              <Badge dot tone={p.status === 'active' ? 'success' : 'neutral'}>
                                {t(`status.${p.status}`, { ns: 'common' })}
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <Link
                                to={tab === 'students' ? '/admin/students' : '/admin/teachers'}
                                className={buttonClass('ghost', 'icon-sm')}
                                aria-label={`${t('actions.edit', { ns: 'common' })}: ${name}`}
                              >
                                <Pencil className="h-4 w-4" aria-hidden />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
                  <p className="text-[13.5px] text-muted-foreground">
                    {t('dashboard.users.listed', { count: tab === 'students' ? d.students.length : d.teachers.length })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/admin/import" className={buttonClass('secondary', 'md')}>
                      <FileUp className="h-4 w-4" aria-hidden />
                      {t('dashboard.users.bulkImport')}
                    </Link>
                    <Link to={tab === 'students' ? '/admin/students' : '/admin/teachers'} className={buttonClass('ink', 'md')}>
                      {t('dashboard.users.viewAll')}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              </Panel>

              <section aria-labelledby="pdf-import-title" className="rounded-panel border border-primary/10 bg-accent-soft p-5 shadow-card sm:p-6">
                <h2 id="pdf-import-title" className="flex items-center gap-3 font-display text-[19px] font-extrabold text-foreground">
                  <FileText className="h-[22px] w-[22px]" aria-hidden />
                  {t('dashboard.pdf.title')}
                  <span title={t('dashboard.pdf.help')} className="text-muted-foreground">
                    <HelpCircle className="h-5 w-5" aria-hidden />
                    <span className="sr-only">{t('dashboard.pdf.help')}</span>
                  </span>
                </h2>
                <p className="mt-3 text-[15.5px] font-medium text-foreground">{t('dashboard.pdf.lead')}</p>
                <p className="mt-1 text-[14px] text-muted-foreground">{t('dashboard.pdf.description')}</p>
                <ol className="mt-5 flex items-start justify-between gap-1">
                  {PIPELINE.map(({ key, icon: Icon }, i) => (
                    <li key={key} className="flex flex-1 items-start">
                      <span className="flex flex-1 flex-col items-center gap-2 text-center">
                        <span
                          className={clsx(
                            'flex h-14 w-14 items-center justify-center rounded-full border-2 bg-surface',
                            i === PIPELINE.length - 1 ? 'border-primary text-primary' : 'border-primary/20 text-accent-ink',
                          )}
                        >
                          <Icon className="h-6 w-6" aria-hidden />
                        </span>
                        <span className="text-[13.5px] font-semibold text-foreground">{t(`dashboard.pdf.steps.${key}`)}</span>
                      </span>
                      {i < PIPELINE.length - 1 && <ArrowRight className="mt-[19px] h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />}
                    </li>
                  ))}
                </ol>
                <div className="mt-5 flex justify-center">
                  <Link to="/admin/exam-archive/upload" className={buttonClass('ink', 'lg', 'min-w-[210px]')}>
                    <FileUp className="h-5 w-5" aria-hidden />
                    {t('dashboard.pdf.upload')}
                  </Link>
                </div>
                {d.reviewFile && (
                  <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[16px] border border-border bg-surface p-3.5">
                    <span className="icon-tile h-11 w-11 bg-danger/10 text-[11px] font-black text-danger">PDF</span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                        <span className="truncate">{d.reviewFile.fileName}</span>
                        <Badge tone="warning">{t('dashboard.pdf.awaitingReview')}</Badge>
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        {t('common.questions', { ns: 'common', count: d.reviewFile.questionCount ?? 0 })} · {t('dashboard.pdf.checkTags')}
                      </p>
                    </div>
                    <Link to="/admin/exam-archive/review" className={buttonClass('secondary', 'sm')}>
                      {t('dashboard.pdf.review')}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                )}
              </section>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
              <Panel
                icon={UsersRound}
                title={t('dashboard.assignments.title')}
                action={
                  <Link to="/admin/assignments" className="link-accent">
                    {t('dashboard.assignments.manage')}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                }
                bodyClassName="px-0 pb-2 sm:px-0"
              >
                <div className="relative overflow-x-auto px-5 sm:px-6">
                  <table className="w-full text-left text-[14.5px]">
                    <caption className="sr-only">{t('dashboard.assignments.title')}</caption>
                    <thead>
                      <tr className="bg-surface-muted text-[13.5px] text-muted-foreground">
                        <th scope="col" className="rounded-l-[12px] px-4 py-3 font-semibold">{t('common.class', { ns: 'common' })}</th>
                        <th scope="col" className="px-4 py-3 font-semibold">{t('common.subject', { ns: 'common' })}</th>
                        <th scope="col" className="px-4 py-3 font-semibold">{t('common.teacher', { ns: 'common' })}</th>
                        <th scope="col" className="px-4 py-3 font-semibold">{t('common.status', { ns: 'common' })}</th>
                        <th scope="col" className="rounded-r-[12px] px-4 py-3 text-right font-semibold">{t('common.actions', { ns: 'common' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.assignments.map((a) => (
                        <tr key={a.id} className="border-b border-border last:border-0">
                          <th scope="row" className="px-4 py-3.5 font-bold text-foreground">{a.className}</th>
                          <td className="px-4 py-3.5 text-foreground">{a.subjectName}</td>
                          <td className="px-4 py-3.5">
                            {a.teacherName && (
                              <span className="flex items-center gap-2.5 text-foreground">
                                <Avatar name={a.teacherName} size={32} />
                                {a.teacherName}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge dot tone="success">{t('dashboard.assignments.assigned')}</Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Link
                              to="/admin/assignments"
                              className={buttonClass('ghost', 'icon-sm')}
                              aria-label={`${t('actions.edit', { ns: 'common' })}: ${a.className} ${a.subjectName}`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel
                icon={Settings2}
                title={t('dashboard.system.title')}
                action={
                  <Badge tone="success" icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}>
                    {t('dashboard.system.allOk')}
                  </Badge>
                }
              >
                <ul className="divide-y divide-border">
                  <li className="flex items-center gap-4 pb-3">
                    <Database className="h-6 w-6 shrink-0 text-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{t('dashboard.system.backupDone')}</p>
                      <p className="text-[13px] text-muted-foreground">
                        {t('dashboard.system.lastBackup')}:{' '}
                        {d.system.lastBackupAt
                          ? formatDate(d.system.lastBackupAt, locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-success" aria-label={t('dashboard.system.ok')} />
                  </li>
                  <li>
                    <Link to="/admin/exam-archive/processing" className="group flex items-center gap-4 py-3">
                      <ListOrdered className="h-6 w-6 shrink-0 text-foreground" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{t('dashboard.system.queue', { count: d.system.queue.total })}</p>
                        <p className="text-[13px] text-muted-foreground">
                          {t('dashboard.system.queueDetail', { running: d.system.queue.running, waiting: d.system.queue.waiting })}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </li>
                  <li className="flex items-center gap-4 pt-3">
                    <BarChart3 className="h-6 w-6 shrink-0 text-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{t('dashboard.system.ai')}</p>
                      <p className="text-[13px] text-muted-foreground">{t('dashboard.system.aiDetail', { value: d.system.aiPercent })}</p>
                    </div>
                    <div className="flex w-[42%] items-center gap-3">
                      <Meter value={d.system.aiPercent} label={t('dashboard.system.ai')} tone={d.system.aiPercent > 85 ? 'warning' : 'role'} />
                      <span className="text-[13.5px] font-semibold tabular-nums text-foreground">{formatPercent(d.system.aiPercent, locale)}</span>
                    </div>
                  </li>
                </ul>
                <Link to="/admin/reports/ai" className="link-accent mt-4">
                  <ListChecks className="h-4 w-4" aria-hidden />
                  {t('dashboard.system.reports')}
                </Link>
              </Panel>
            </div>
          </>
        )}
      </AsyncContent>
    </>
  );
}
