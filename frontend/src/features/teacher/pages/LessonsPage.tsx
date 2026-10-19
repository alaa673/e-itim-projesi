import { BookOpen, Eye, FileText, Pencil, Presentation as PresentationIcon, Share2, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Column } from '@/components/ui/DataTable';
import { FileDrop } from '@/components/ui/FileDrop';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { SimulatedNote } from '@/components/ui/SimulatedNote';
import { Textarea } from '@/components/ui/Textarea';
import { useAction } from '@/hooks/useAction';
import { useListQuery } from '@/hooks/useListQuery';
import { useStateFlag } from '@/hooks/useOpenParam';
import { useResourceList } from '@/hooks/useResourceList';
import { generateSummary, type Lesson, lessonApi, type LessonInput } from '../services/teacherApi';
import { useTeachingScope } from '../hooks/useTeachingScope';
import { FileLink } from '@/components/ui/FileLink';

export default function LessonsPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const scope = useTeachingScope();
  const navigate = useNavigate();
  const lq = useListQuery<'status' | 'topic'>({ sort: { key: 'updatedAt', direction: 'desc' }, descFirst: ['updatedAt'] });
  const list = useResourceList(lessonApi.list, lq.query);
  const [editor, setEditor] = useState<{ lesson: Lesson | null } | null>(null);
  const [viewing, setViewing] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState<Lesson | null>(null);
  const { run, busy } = useAction();
  useStateFlag('openUpload', () => setEditor({ lesson: null }));

  const columns: Column<Lesson>[] = [
    {
      id: 'title',
      header: t('common.title', { ns: 'common' }),
      sortKey: 'title',
      rowHeader: true,
      cell: (l) => (
        <button type="button" onClick={() => setViewing(l)} className="flex min-w-[240px] items-center gap-3 text-left">
          <span className="icon-tile h-10 w-10 bg-tint-violet text-ink-violet">
            <FileText className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <span>
            <span className="block font-semibold text-foreground hover:text-accent-ink hover:underline">{l.title}</span>
            <span className="block text-[12.5px] font-normal text-muted-foreground">{l.fileName ?? t('lessons.noFile')}</span>
          </span>
        </button>
      ),
    },
    { id: 'topic', header: t('common.topic', { ns: 'common' }), cell: (l) => l.topic },
    { id: 'classes', header: t('lessons.sharedWith'), hideOnMobile: true, cell: (l) => <span className="flex flex-wrap gap-1">{l.classNames.map((c) => <Badge key={c}>{c}</Badge>)}</span> },
    { id: 'status', header: t('common.status', { ns: 'common' }), cell: (l) => <Badge tone={l.status === 'shared' ? 'success' : 'neutral'} dot>{t(`lessons.status.${l.status}`)}</Badge> },
    { id: 'views', header: t('lessons.views'), align: 'right', hideOnMobile: true, cell: (l) => <span className="tabular-nums">{l.views}</span> },
    { id: 'updatedAt', header: t('common.lastUpdated', { ns: 'common' }), sortKey: 'updatedAt', hideOnMobile: true, cell: (l) => <span className="text-muted-foreground"><RelativeTime iso={l.updatedAt} /></span> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (l) => (
        <span className="flex justify-end gap-1">
          <IconButton icon={Eye} label={`${t('actions.view', { ns: 'common' })}: ${l.title}`} onClick={() => setViewing(l)} />
          <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${l.title}`} onClick={() => setEditor({ lesson: l })} />
          <IconButton icon={PresentationIcon} tone="accent" label={`${t('lessons.toSlides')}: ${l.title}`} onClick={() => navigate('/teacher/presentations', { state: { fromLesson: l.id } })} />
          <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${l.title}`} onClick={() => setDeleting(l)} />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('nav.teacher.lessons', { ns: 'common' })}
        description={t('lessons.description')}
        actions={
          <Button variant="ink" icon={<Sparkles className="h-4 w-4" aria-hidden />} onClick={() => setEditor({ lesson: null })}>
            {t('dashboard.pdfSummary')}
          </Button>
        }
      />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('lessons.searchPlaceholder')}
        filters={[
          { key: 'status', label: t('common.status', { ns: 'common' }), value: lq.filters.status ?? '', allLabel: t('common.allStatuses', { ns: 'common' }), options: (['shared', 'draft'] as const).map((v) => ({ value: v, label: t(`lessons.status.${v}`) })) },
          { key: 'topic', label: t('common.topic', { ns: 'common' }), value: lq.filters.topic ?? '', allLabel: t('lessons.allTopics'), options: scope.allTopics.map((v) => ({ value: v, label: v })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'status' | 'topic', v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('nav.teacher.lessons', { ns: 'common' })}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={viewing?.id ?? editor?.lesson?.id ?? null}
        empty={{ icon: <BookOpen className="h-5 w-5" aria-hidden />, title: t('lessons.empty'), action: <Button size="sm" onClick={() => setEditor({ lesson: null })}>{t('dashboard.pdfSummary')}</Button> }}
      />

      <LessonEditor
        open={editor !== null}
        lesson={editor?.lesson ?? null}
        onClose={() => setEditor(null)}
        onSaved={(saved, created) => {
          setEditor(null);
          if (created) list.refresh();
          else list.updateItem(saved);
        }}
      />

      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        variant="side"
        title={viewing?.title ?? ''}
        description={viewing ? `${viewing.topic} · ${viewing.classNames.join(', ')}` : undefined}
        footer={
          viewing && (
            <>
              <Button variant="secondary" icon={<PresentationIcon className="h-4 w-4" aria-hidden />} onClick={() => navigate('/teacher/presentations', { state: { fromLesson: viewing.id } })}>
                {t('lessons.toSlides')}
              </Button>
              <Button
                icon={<Pencil className="h-4 w-4" aria-hidden />}
                onClick={() => {
                  setEditor({ lesson: viewing });
                  setViewing(null);
                }}
              >
                {t('actions.edit', { ns: 'common' })}
              </Button>
            </>
          )
        }
      >
        {viewing && (
          <>
            <ol className="space-y-3">
              {viewing.summary.split('\n').filter(Boolean).map((line, i) => (
                <li key={i} className="flex gap-3 rounded-[14px] bg-surface-muted p-3 text-[14.5px] leading-relaxed text-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">{i + 1}</span>
                  {line}
                </li>
              ))}
            </ol>
            {viewing.fileName && <FileLink className="mt-4" name={viewing.fileName} url={viewing.fileUrl} />}
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={t('lessons.deleteTitle')}
        message={t('lessons.deleteMessage', { title: deleting?.title ?? '' })}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await run(async () => {
            await lessonApi.remove(deleting.id);
            return true;
          }, { success: t('lessons.deleted') });
          setDeleting(null);
          if (ok) list.refresh();
        }}
      />
    </>
  );
}

function LessonEditor({ open, lesson, onClose, onSaved }: { open: boolean; lesson: Lesson | null; onClose: () => void; onSaved: (l: Lesson, created: boolean) => void }) {
  const { t } = useTranslation(['teacher', 'common']);
  const scope = useTeachingScope();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<LessonInput>({ title: '', subject: '', topic: '', classNames: [], fileName: null, summary: '', status: 'draft' });
  const [files, setFiles] = useState<File[]>([]);
  const [simulated, setSimulated] = useState(false);
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setFiles([]);
    setSimulated(false);
    if (lesson) {
      setForm({ title: lesson.title, subject: lesson.subject, topic: lesson.topic, classNames: lesson.classNames, fileName: lesson.fileName, fileId: lesson.fileId ?? null, summary: lesson.summary, status: lesson.status });
      setStep(2);
    } else {
      setForm({ title: '', subject: '', topic: '', classNames: [], fileName: null, summary: '', status: 'draft' });
      setStep(1);
    }
  }, [open, lesson]);

  const metaInvalid = !form.title.trim() || !form.topic || form.classNames.length === 0;

  const makeSummary = async () => {
    setTouched(true);
    if (metaInvalid) return;
    const res = await run(() => generateSummary({ file: files[0] ?? null, topic: form.topic, title: form.title }));
    if (res) {
      setForm((f) => ({ ...f, summary: res.summary, fileName: files[0]?.name ?? f.fileName, fileId: res.fileId ?? f.fileId ?? null }));
      setSimulated(res.simulated);
      setStep(2);
    }
  };
  const save = async (status: Lesson['status']) => {
    setTouched(true);
    if (metaInvalid || !form.summary.trim()) return;
    const input = { ...form, status, subject: form.subject || scope.subjectOf(form.classNames) };
    const saved = await run(() => (lesson ? lessonApi.update(lesson.id, input) : lessonApi.create(input)), {
      success: t(status === 'shared' ? 'lessons.shared' : 'lessons.savedDraft', { classes: form.classNames.join(', ') }),
    });
    if (saved) onSaved(saved, !lesson);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      preventClose={busy}
      title={lesson ? t('lessons.editTitle') : t('dashboard.pdfSummary')}
      description={step === 1 ? t('lessons.step1') : t('lessons.step2')}
      footer={
        step === 1 ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button variant="ink" loading={busy} icon={<Sparkles className="h-4 w-4" aria-hidden />} onClick={() => void makeSummary()}>
              {t('lessons.makeSummary')}
            </Button>
          </>
        ) : (
          <>
            {!lesson && (
              <Button variant="ghost" className="mr-auto" onClick={() => setStep(1)} disabled={busy}>
                {t('actions.back', { ns: 'common' })}
              </Button>
            )}
            <Button variant="secondary" disabled={busy} onClick={() => void save('draft')}>
              {t('actions.saveDraft', { ns: 'common' })}
            </Button>
            <Button loading={busy} icon={<Share2 className="h-4 w-4" aria-hidden />} onClick={() => void save('shared')}>
              {t('lessons.shareWith', { count: form.classNames.length })}
            </Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('common.title', { ns: 'common' })} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={touched && !form.title.trim() ? t('validation.required', { ns: 'common' }) : undefined} />
            <Select
              label={t('common.topic', { ns: 'common' })}
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholderOption={t('common.selectPlaceholder', { ns: 'common' })}
              options={scope.allTopics.map((v) => ({ value: v, label: v }))}
              error={touched && !form.topic ? t('validation.required', { ns: 'common' }) : undefined}
            />
          </div>
          <fieldset>
            <legend className="field-label">{t('lessons.classes')}</legend>
            <div className="flex flex-wrap gap-4">
              {scope.classNames.map((c) => (
                <Checkbox key={c} label={c} checked={form.classNames.includes(c)} onChange={(e) => setForm({ ...form, classNames: e.target.checked ? [...form.classNames, c] : form.classNames.filter((x) => x !== c) })} />
              ))}
            </div>
            {touched && form.classNames.length === 0 && <p className="mt-1 text-[13px] text-danger">{t('validation.pickOne', { ns: 'common' })}</p>}
          </fieldset>
          <FileDrop label={`${t('lessons.pdf')} (${t('common.optional', { ns: 'common' })})`} accept=".pdf,application/pdf" files={files} onChange={setFiles} hint={t('lessons.pdfHint')} />
        </div>
      ) : (
        <div className="space-y-4">
          <SimulatedNote show={simulated} />
          <Textarea
            label={t('lessons.summary')}
            rows={10}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            hint={t('lessons.summaryHint')}
            error={touched && !form.summary.trim() ? t('validation.required', { ns: 'common' }) : undefined}
          />
          <p className="text-[13px] text-muted-foreground">
            {form.topic} · {form.classNames.join(', ')}
          </p>
        </div>
      )}
    </Modal>
  );
}
