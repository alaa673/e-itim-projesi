import clsx from 'clsx';
import { CheckCircle2, Circle, CircleDot, FileText, PencilRuler } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Modal } from '@/components/ui/Modal';
import { AsyncContent, Skeleton } from '@/components/ui/States';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { useOpenParam } from '@/hooks/useOpenParam';
import { formatPercent } from '@/utils/format';
import { CourseCard } from '../components/CourseCard';
import { materialApi, subjectApi } from '../services/studentApi';
import type { StudentSubject, StudentTopic } from '../types';

const STATUS_ICON = { done: CheckCircle2, inProgress: CircleDot, todo: Circle };
const STATUS_TONE = { done: 'text-success', inProgress: 'text-accent-ink', todo: 'text-muted-foreground' };

export default function SubjectsPage() {
  const { t } = useTranslation(['student', 'common']);
  const { data, error, loading, reload } = useAsync((signal) => subjectApi.list(signal), []);
  const [open, setOpen] = useState<StudentSubject | null>(null);
  useOpenParam((id) => setOpen(data?.find((s) => s.id === id) ?? null), Boolean(data));

  return (
    <>
      <PageHeader title={t('nav.student.subjects', { ns: 'common' })} description={t('subjects.description')} />
      <AsyncContent
        data={data}
        error={error}
        loading={loading}
        reload={reload}
        skeleton={
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-panel" />
            ))}
          </div>
        }
      >
        {(subjects) => (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((s) => (
              <li key={s.id} className="flex flex-col">
                <CourseCard subject={s} headingLevel={2} />
                <button type="button" onClick={() => setOpen(s)} className="link-accent mt-2 self-start px-1 text-[13.5px]">
                  {t('subjects.units', { count: s.units.length })} · {t('subjects.seeTopics')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </AsyncContent>
      <SubjectDetail subject={open} onClose={() => setOpen(null)} />
    </>
  );
}

function SubjectDetail({ subject, onClose }: { subject: StudentSubject | null; onClose: () => void }) {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const materials = useAsync((signal) => (subject ? materialApi.list({ offset: 0, limit: 20, filters: { subject: subject.name }, sortKey: 'sharedAt', sortDirection: 'desc' }, signal) : Promise.resolve(null)), [subject?.name]);

  const practiceLink = (topic: StudentTopic) => `/student/practice?subject=${encodeURIComponent(subject?.name ?? '')}&topic=${encodeURIComponent(topic.name)}`;

  return (
    <Modal open={subject !== null} onClose={onClose} variant="side" size="lg" title={subject?.name ?? ''} description={subject ? `${subject.teacher} · ${t('subjects.progress', { done: subject.topicsDone, total: subject.topicsTotal })}` : undefined}>
      {subject && (
        <>
          <ol className="space-y-4">
            {subject.units.map((u, ui) => (
              <li key={u.id} className="rounded-[16px] border border-border">
                <h3 className="border-b border-border bg-surface-muted/60 px-4 py-2.5 text-[14.5px] font-bold text-foreground">
                  {ui + 1}. {u.name}
                </h3>
                <ul className="divide-y divide-border">
                  {u.topics.map((tp) => {
                    const Icon = STATUS_ICON[tp.status];
                    return (
                      <li key={tp.id} className="flex items-center gap-3 px-4 py-2.5">
                        <Icon className={clsx('h-[18px] w-[18px] shrink-0', STATUS_TONE[tp.status])} aria-label={t(`subjects.status.${tp.status}`)} />
                        <span className="min-w-0 flex-1 text-[14.5px] text-foreground">{tp.name}</span>
                        {tp.score !== null && <span className="text-[13px] font-semibold tabular-nums text-muted-foreground">{formatPercent(tp.score, locale)}</span>}
                        <Link to={practiceLink(tp)} className={buttonClass('ghost', 'sm')} aria-label={`${t('subjects.practice')}: ${tp.name}`}>
                          <PencilRuler className="h-4 w-4" aria-hidden />
                          <span className="hidden sm:inline">{t('subjects.practice')}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
          <h3 className="mt-6 font-display text-[16px] font-extrabold text-foreground">{t('subjects.materials')}</h3>
          {materials.data && materials.data.items.length === 0 && <p className="mt-2 text-[14px] text-muted-foreground">{t('subjects.noMaterials')}</p>}
          <ul className="mt-3 space-y-2">
            {(materials.data?.items ?? []).map((m) => (
              <li key={m.id}>
                <Link to={`/student/materials?open=${m.id}`} className="flex items-center gap-3 rounded-[14px] border border-border px-4 py-3 transition-colors hover:border-primary/40">
                  <FileText className="h-5 w-5 text-accent-ink" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-foreground">{m.title}</span>
                    <span className="block text-[12.5px] text-muted-foreground">{t(`materials.kinds.${m.kind}`)} · {m.topic}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}
