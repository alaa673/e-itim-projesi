import { MonitorPlay, Pencil, Plus, Presentation as PresentationIcon, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { SlideDeck } from '@/components/slides/SlideDeck';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { SimulatedNote } from '@/components/ui/SimulatedNote';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { Textarea } from '@/components/ui/Textarea';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { generateSlides, lessonApi, type Presentation, presentationApi, type PresentationInput, type Slide } from '../services/teacherApi';
import { useTeachingScope } from '../hooks/useTeachingScope';

export default function PresentationsPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const location = useLocation();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync((signal) => presentationApi.list({ offset: 0, limit: 100, sortKey: 'updatedAt', sortDirection: 'desc' }, signal), []);
  const [viewing, setViewing] = useState<Presentation | null>(null);
  const [editor, setEditor] = useState<{ item: Presentation | null; fromLesson?: string } | null>(null);
  const [deleting, setDeleting] = useState<Presentation | null>(null);
  const { run, busy } = useAction();

  useEffect(() => {
    const fromLesson = (location.state as { fromLesson?: string } | null)?.fromLesson;
    if (fromLesson) {
      setEditor({ item: null, fromLesson });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  return (
    <>
      <PageHeader
        title={t('nav.teacher.presentations', { ns: 'common' })}
        description={t('slides.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditor({ item: null })}>
            {t('slides.add')}
          </Button>
        }
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(page) =>
          page.items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<PresentationIcon className="h-5 w-5" aria-hidden />} title={t('slides.empty')} />
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {page.items.map((p) => (
                <li key={p.id} className="panel flex flex-col overflow-hidden">
                  <button type="button" onClick={() => setViewing(p)} className="group relative block aspect-video bg-[linear-gradient(135deg,#2a1458,#47237f_60%,#6c3be6)] p-5 text-left text-white" aria-label={`${t('slides.open')}: ${p.title}`}>
                    <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">{p.topic}</span>
                    <span className="mt-1 block font-display text-[20px] font-extrabold leading-tight">{p.slides[0]?.title ?? p.title}</span>
                    <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:scale-110">
                      <MonitorPlay className="h-5 w-5" aria-hidden />
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-display text-[16.5px] font-extrabold text-foreground">{p.title}</h2>
                      <Badge tone={p.status === 'ready' ? 'success' : 'neutral'} dot>
                        {t(`slides.status.${p.status}`)}
                      </Badge>
                    </div>
                    <p className="text-[13px] text-muted-foreground">
                      {p.className} · {t('slides.count', { count: p.slides.length })} · <RelativeTime iso={p.updatedAt} />
                    </p>
                    <div className="mt-auto flex justify-end gap-1 pt-3">
                      <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${p.title}`} onClick={() => setEditor({ item: p })} />
                      <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${p.title}`} onClick={() => setDeleting(p)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </AsyncContent>

      <Modal open={viewing !== null} onClose={() => setViewing(null)} size="xl" title={viewing?.title ?? ''} description={viewing ? `${viewing.topic} · ${viewing.className}` : undefined}>
        {viewing && <SlideDeck slides={viewing.slides} title={viewing.title} />}
      </Modal>

      <PresentationEditor
        open={editor !== null}
        item={editor?.item ?? null}
        fromLesson={editor?.fromLesson}
        onClose={() => setEditor(null)}
        onSaved={() => {
          setEditor(null);
          reload();
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('slides.deleteTitle')}
        message={t('slides.deleteMessage', { title: deleting?.title ?? '' })}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await run(async () => {
            await presentationApi.remove(deleting.id);
            return true;
          }, { success: t('slides.deleted') });
          setDeleting(null);
          if (ok) reload();
        }}
      />
    </>
  );
}

function PresentationEditor({ open, item, fromLesson, onClose, onSaved }: { open: boolean; item: Presentation | null; fromLesson?: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation(['teacher', 'common']);
  const scope = useTeachingScope();
  const lessons = useAsync((signal) => (open ? lessonApi.list({ offset: 0, limit: 100, sortKey: 'updatedAt', sortDirection: 'desc' }, signal) : Promise.resolve(null)), [open]);
  const [lessonId, setLessonId] = useState('');
  const [form, setForm] = useState<PresentationInput>({ title: '', topic: '', className: '', slides: [], status: 'draft' });
  const [simulated, setSimulated] = useState(false);
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setSimulated(false);
    setLessonId(fromLesson ?? '');
    setForm(item ? { title: item.title, topic: item.topic, className: item.className, slides: item.slides.map((s) => ({ ...s, bullets: [...s.bullets] })), status: item.status } : { title: '', topic: '', className: scope.classNames[0] ?? '', slides: [], status: 'draft' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item, fromLesson]);

  const lesson = lessons.data?.items.find((l) => l.id === lessonId);
  const setSlide = (i: number, patch: Partial<Slide>) => setForm((f) => ({ ...f, slides: f.slides.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const invalid = !form.title.trim() || form.slides.length === 0 || form.slides.some((s) => !s.title.trim());

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      preventClose={busy}
      title={item ? t('slides.editTitle') : t('slides.add')}
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          {(['draft', 'ready'] as const).map((status) => (
            <Button
              key={status}
              variant={status === 'ready' ? 'primary' : 'secondary'}
              loading={busy && status === 'ready'}
              disabled={busy}
              onClick={async () => {
                setTouched(true);
                if (invalid) return;
                const input = { ...form, status, slides: form.slides.map((s) => ({ title: s.title.trim(), bullets: s.bullets.map((b) => b.trim()).filter(Boolean) })) };
                const ok = await run(() => (item ? presentationApi.update(item.id, input) : presentationApi.create(input)), { success: t('slides.saved') });
                if (ok) onSaved();
              }}
            >
              {status === 'ready' ? t('slides.markReady') : t('actions.saveDraft', { ns: 'common' })}
            </Button>
          ))}
        </>
      }
    >
      {!item && (
        <div className="mb-5 rounded-[16px] bg-surface-muted p-4">
          <p className="font-semibold text-foreground">{t('slides.fromSummary')}</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <Select
              containerClassName="flex-1"
              label={t('slides.lesson')}
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              placeholderOption={t('common.selectPlaceholder', { ns: 'common' })}
              options={(lessons.data?.items ?? []).map((l) => ({ value: l.id, label: `${l.title} · ${l.topic}` }))}
            />
            <Button
              variant="ink"
              disabled={!lesson}
              loading={busy}
              icon={<Sparkles className="h-4 w-4" aria-hidden />}
              onClick={async () => {
                if (!lesson) return;
                const res = await run(() => generateSlides({ title: lesson.title, summary: lesson.summary }));
                if (res) {
                  setForm((f) => ({ ...f, title: f.title || lesson.title, topic: lesson.topic, className: lesson.classNames[0] ?? f.className, slides: res.slides }));
                  setSimulated(res.simulated);
                }
              }}
            >
              {t('slides.generate')}
            </Button>
          </div>
        </div>
      )}
      <SimulatedNote show={simulated} className="mb-4" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input containerClassName="sm:col-span-2" label={t('common.title', { ns: 'common' })} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={touched && !form.title.trim() ? t('validation.required', { ns: 'common' }) : undefined} />
        <Select label={t('common.class', { ns: 'common' })} value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} options={scope.classNames.map((c) => ({ value: c, label: c }))} placeholderOption={scope.classNames.length ? undefined : t('common.selectPlaceholder', { ns: 'common' })} />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <h3 className="font-display text-[16px] font-extrabold text-foreground">{t('slides.slides', { count: form.slides.length })}</h3>
        <Button size="sm" variant="soft" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setForm({ ...form, slides: [...form.slides, { title: '', bullets: [''] }] })}>
          {t('slides.addSlide')}
        </Button>
      </div>
      {touched && form.slides.length === 0 && <p className="mt-2 text-[13px] text-danger">{t('slides.needSlides')}</p>}
      <ol className="mt-3 space-y-3">
        {form.slides.map((s, i) => (
          <li key={i} className="rounded-[16px] border border-border p-4">
            <div className="flex items-start gap-2">
              <span className="mt-9 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">{i + 1}</span>
              <div className="grid flex-1 gap-3">
                <Input label={t('slides.slideTitle')} value={s.title} onChange={(e) => setSlide(i, { title: e.target.value })} error={touched && !s.title.trim() ? t('validation.required', { ns: 'common' }) : undefined} />
                <Textarea label={t('slides.bullets')} hint={t('slides.bulletsHint')} rows={3} value={s.bullets.join('\n')} onChange={(e) => setSlide(i, { bullets: e.target.value.split('\n') })} />
              </div>
              <IconButton className="mt-8" icon={X} tone="danger" label={t('slides.removeSlide', { number: i + 1 })} onClick={() => setForm({ ...form, slides: form.slides.filter((_, j) => j !== i) })} />
            </div>
          </li>
        ))}
      </ol>
    </Modal>
  );
}
