import clsx from 'clsx';
import { CheckCircle2, FileCheck2, NotebookPen, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { DueLabel, RelativeTime } from '@/components/layout/RelativeTime';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DetailList } from '@/components/ui/DetailList';
import { FileDrop } from '@/components/ui/FileDrop';
import { Modal } from '@/components/ui/Modal';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { useOpenParam } from '@/hooks/useOpenParam';
import { daysFromToday, formatPercent } from '@/utils/format';
import { subjectIcon } from '../subjectIcon';
import { homeworkApi } from '../services/studentApi';
import type { StudentHomework } from '../types';
import { FileLink } from '@/components/ui/FileLink';

type View = StudentHomework['status'];
const TONE = { todo: 'warning', submitted: 'info', graded: 'success' } as const;

export default function StudentHomeworkPage() {
  const { t } = useTranslation(['student', 'common']);
  const { data, error, loading, reload } = useAsync((signal) => homeworkApi.list({ offset: 0, limit: 100, sortKey: 'due' }, signal), []);
  const [view, setView] = useState<View>('todo');
  const [open, setOpen] = useState<StudentHomework | null>(null);
  useOpenParam((id) => setOpen(data?.items.find((h) => h.id === id) ?? null), Boolean(data));

  const items = (data?.items ?? []).filter((h) => h.status === view);
  const count = (v: View) => (data?.items ?? []).filter((h) => h.status === v).length;

  return (
    <>
      <PageHeader title={t('nav.student.assignments', { ns: 'common' })} description={t('homework.description')} />
      <Tabs<View>
        className="mb-4"
        label={t('homework.viewLabel')}
        value={view}
        onChange={setView}
        items={(['todo', 'submitted', 'graded'] as const).map((v) => ({ value: v, label: t(`homework.tabs.${v}`), count: count(v) }))}
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {() =>
          items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<NotebookPen className="h-5 w-5" aria-hidden />} title={t(`homework.empty.${view}`)} />
            </div>
          ) : (
            <ul className="space-y-3">
              {(view === 'todo' ? items : [...items].reverse()).map((h) => {
                const Icon = subjectIcon(h.subject);
                const late = h.status === 'todo' && daysFromToday(h.due) < 0;
                return (
                  <li key={h.id}>
                    <button type="button" onClick={() => setOpen(h)} className="panel card-interactive flex w-full flex-wrap items-center gap-4 p-4 text-left sm:flex-nowrap">
                      <span className="icon-tile h-12 w-12 bg-tint-mint text-ink-mint">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[16.5px] font-extrabold text-foreground">{h.title}</span>
                        <span className="block text-[13px] text-muted-foreground">
                          {h.subject} · {h.teacher}
                        </span>
                      </span>
                      <span className="text-right text-[13px]">
                        {h.status === 'graded' && h.score !== null ? (
                          <span className="font-display text-[22px] font-extrabold text-foreground">{h.score}</span>
                        ) : (
                          <span className={clsx('font-semibold', late ? 'text-danger' : 'text-foreground')}>
                            {late ? t('homework.late') : t('common.due', { ns: 'common' })}: <DueLabel iso={h.due} />
                          </span>
                        )}
                        <Badge tone={TONE[h.status]} className="mt-1" dot>
                          {t(`homework.status.${h.status}`)}
                        </Badge>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        }
      </AsyncContent>
      <HomeworkDrawer
        homework={open}
        onClose={() => setOpen(null)}
        onSubmitted={(h) => {
          setOpen(h);
          reload();
        }}
      />
    </>
  );
}

function HomeworkDrawer({ homework, onClose, onSubmitted }: { homework: StudentHomework | null; onClose: () => void; onSubmitted: (h: StudentHomework) => void }) {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();
  useEffect(() => {
    setText('');
    setFiles([]);
    setTouched(false);
  }, [homework?.id]);

  const canSubmit = homework?.status === 'todo';
  const invalid = !text.trim() && files.length === 0;

  return (
    <Modal
      open={homework !== null}
      onClose={onClose}
      variant="side"
      size="lg"
      preventClose={busy}
      title={homework?.title ?? ''}
      description={homework ? `${homework.subject} · ${homework.teacher}` : undefined}
      footer={
        canSubmit && (
          <Button
            loading={busy}
            icon={<Send className="h-4 w-4" aria-hidden />}
            onClick={async () => {
              setTouched(true);
              if (!homework || invalid) return;
              const saved = await run(() => homeworkApi.submit(homework.id, { text: text.trim(), file: files[0] ?? null }), { success: t('homework.submittedToast') });
              if (saved) onSubmitted(saved);
            }}
          >
            {t('homework.submit')}
          </Button>
        )
      }
    >
      {homework && (
        <>
          <DetailList
            items={[
              { label: t('common.due', { ns: 'common' }), value: <DueLabel iso={homework.due} /> },
              { label: t('common.status', { ns: 'common' }), value: t(`homework.status.${homework.status}`) },
            ]}
          />
          <h3 className="mt-5 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">{t('homework.instructions')}</h3>
          <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-foreground">{homework.description}</p>
          <h3 className="mt-5 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">{t('homework.rubric')}</h3>
          <ul className="mt-2 space-y-1.5">
            {homework.rubric.map((r) => (
              <li key={r.name} className="flex justify-between rounded-[10px] bg-surface-muted px-3 py-2 text-[14px]">
                <span>{r.name}</span>
                <span className="font-semibold tabular-nums">{formatPercent(r.weight, locale)}</span>
              </li>
            ))}
          </ul>

          {homework.submission && (
            <section className="mt-6 rounded-[16px] border border-border p-4">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <FileCheck2 className="h-4 w-4 text-success" aria-hidden />
                {t('homework.yourSubmission')} · <span className="font-normal text-muted-foreground"><RelativeTime iso={homework.submission.at} /></span>
              </h3>
              <p className="mt-2 whitespace-pre-line text-[14.5px] text-foreground">{homework.submission.text}</p>
              {homework.submission.fileName && <FileLink className="mt-2" name={homework.submission.fileName} url={homework.submission.fileUrl} />}
            </section>
          )}
          {homework.status === 'graded' && (
            <section className="mt-4 rounded-[16px] bg-success/[0.08] p-4">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
                {t('homework.score', { score: homework.score ?? 0 })}
              </p>
              {homework.feedback && <p className="mt-2 text-[14.5px] text-foreground">“{homework.feedback}”</p>}
            </section>
          )}
          {canSubmit && (
            <section className="mt-6 space-y-4">
              <Textarea label={t('homework.answer')} rows={5} value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} placeholder={t('homework.answerPlaceholder')} />
              <FileDrop label={`${t('homework.file')} (${t('common.optional', { ns: 'common' })})`} accept=".pdf,.jpg,.jpeg,.png,.docx" maxSize={10 * 1024 * 1024} files={files} onChange={setFiles} hint={t('homework.fileHint')} />
              {touched && invalid && <p className="text-[13px] text-danger">{t('homework.needContent')}</p>}
            </section>
          )}
        </>
      )}
    </Modal>
  );
}
