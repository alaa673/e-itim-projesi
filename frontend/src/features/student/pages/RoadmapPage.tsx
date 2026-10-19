import clsx from 'clsx';
import { Check, Flag, GraduationCap, Map as MapIcon, Pencil, Plus, Rocket, Trash2, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Meter } from '@/components/charts/Meter';
import { TONE_CARD } from '@/components/dashboard/tones';
import { FormModal } from '@/components/form/FormModal';
import { required } from '@/components/form/validation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { AsyncContent } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { roadmapApi } from '../services/studentApi';
import type { RoadmapStep } from '../types';

type Phase = RoadmapStep['phase'];
const PHASES: { id: Phase; icon: LucideIcon; tone: 'violet' | 'sky' | 'mint' | 'peach' }[] = [
  { id: 'now', icon: Flag, tone: 'violet' },
  { id: 'thisYear', icon: MapIcon, tone: 'sky' },
  { id: 'university', icon: GraduationCap, tone: 'mint' },
  { id: 'career', icon: Rocket, tone: 'peach' },
];
const MAX_STEPS = 40;

const schema = z.object({
  phase: z.enum(['now', 'thisYear', 'university', 'career']),
  title: required().pipe(z.string().min(3, 'validation.tooShort').max(80, 'validation.tooLong')),
  description: z.string().trim().max(240, 'validation.tooLong'),
});
type FormValues = z.infer<typeof schema>;

export default function RoadmapPage() {
  const { t } = useTranslation(['student', 'common']);
  const { data, error, loading, reload } = useAsync((signal) => roadmapApi.list({ offset: 0, limit: 100 }, signal), []);
  const [form, setForm] = useState<{ step?: RoadmapStep; phase: Phase } | null>(null);
  const [deleting, setDeleting] = useState<RoadmapStep | null>(null);
  const { run, busy } = useAction();
  const steps = data?.items ?? [];
  const done = steps.filter((s) => s.done).length;

  const toggle = async (s: RoadmapStep) => {
    const ok = await run(() => roadmapApi.update(s.id, { done: !s.done }));
    if (ok) reload();
  };

  return (
    <>
      <PageHeader
        title={t('nav.student.roadmap', { ns: 'common' })}
        description={t('roadmap.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} disabled={steps.length >= MAX_STEPS} onClick={() => setForm({ phase: 'now' })}>
            {t('roadmap.add')}
          </Button>
        }
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {() => (
          <>
            <section aria-label={t('roadmap.progress')} className="panel mb-6 flex flex-wrap items-center gap-4 p-5">
              <p className="font-display text-[15px] font-extrabold text-foreground">{t('roadmap.progress')}</p>
              <Meter className="min-w-[200px] flex-1" value={done} max={Math.max(1, steps.length)} label={t('roadmap.progressAria', { done, total: steps.length })} tone="success" />
              <p className="text-[14px] font-semibold tabular-nums text-foreground">{t('roadmap.doneOf', { done, total: steps.length })}</p>
            </section>

            <ol className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
              {PHASES.map((phase, index) => {
                const items = steps.filter((s) => s.phase === phase.id);
                const Icon = phase.icon;
                return (
                  <li key={phase.id} className="panel flex flex-col overflow-hidden">
                    <section aria-labelledby={`phase-${phase.id}`} className="flex flex-1 flex-col">
                      <header className={clsx('flex items-center gap-3 px-5 py-4', TONE_CARD[phase.tone].card)}>
                        <span className={clsx('icon-tile h-11 w-11', TONE_CARD[phase.tone].tile)}>
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={clsx('text-[12px] font-bold uppercase tracking-wide', TONE_CARD[phase.tone].text)}>{t('roadmap.stage', { n: index + 1 })}</p>
                          <h2 id={`phase-${phase.id}`} className="font-display text-[17px] font-extrabold text-foreground">
                            {t(`roadmap.phase.${phase.id}`)}
                          </h2>
                        </div>
                        <span className="text-[13px] font-semibold tabular-nums text-foreground/70">
                          {items.filter((s) => s.done).length}/{items.length}
                        </span>
                      </header>
                      <ul className="flex-1 space-y-2.5 p-4">
                        {items.length === 0 && <li className="rounded-[14px] border border-dashed border-border px-3 py-6 text-center text-[13.5px] text-muted-foreground">{t('roadmap.emptyPhase')}</li>}
                        {items.map((s) => (
                          <li key={s.id} className={clsx('rounded-[14px] border p-3 transition-colors', s.done ? 'border-success/30 bg-success/[0.06]' : 'border-border')}>
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={s.done}
                                aria-label={s.title}
                                onClick={() => void toggle(s)}
                                disabled={busy}
                                className={clsx('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] border-2 transition-colors', s.done ? 'border-success bg-success text-white' : 'border-input hover:border-primary')}
                              >
                                {s.done && <Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className={clsx('text-[14.5px] font-semibold', s.done ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground')}>{s.title}</p>
                                {s.description && <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{s.description}</p>}
                              </div>
                              <span className="flex shrink-0 -space-x-1">
                                <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${s.title}`} onClick={() => setForm({ step: s, phase: s.phase })} />
                                <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${s.title}`} onClick={() => setDeleting(s)} />
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="px-4 pb-4">
                        <Button variant="ghost" size="sm" className="w-full" icon={<Plus className="h-4 w-4" aria-hidden />} disabled={steps.length >= MAX_STEPS} onClick={() => setForm({ phase: phase.id })}>
                          {t('roadmap.addTo', { phase: t(`roadmap.phase.${phase.id}`) })}
                        </Button>
                      </div>
                    </section>
                  </li>
                );
              })}
            </ol>
            {steps.length >= MAX_STEPS && <p className="mt-3 text-[13px] text-muted-foreground">{t('roadmap.max', { count: MAX_STEPS })}</p>}
          </>
        )}
      </AsyncContent>

      <FormModal<FormValues>
        open={form !== null}
        title={form?.step ? t('roadmap.editTitle') : t('roadmap.add')}
        schema={schema}
        defaultValues={form?.step ? { phase: form.step.phase, title: form.step.title, description: form.step.description } : { phase: form?.phase ?? 'now', title: '', description: '' }}
        fields={[
          { name: 'phase', label: t('roadmap.phaseLabel'), type: 'select', options: PHASES.map((p) => ({ value: p.id, label: t(`roadmap.phase.${p.id}`) })), span: 2 },
          { name: 'title', label: t('roadmap.stepTitle'), placeholder: t('roadmap.stepPlaceholder'), span: 2 },
          { name: 'description', label: t('roadmap.stepDescription'), type: 'textarea', rows: 3, span: 2 },
        ]}
        submitLabel={t('actions.save', { ns: 'common' })}
        onClose={() => setForm(null)}
        onSubmit={async (values) => {
          const step = form?.step;
          const ok = await run(() => (step ? roadmapApi.update(step.id, values) : roadmapApi.create({ ...values, done: false })), { success: step ? t('roadmap.updated') : t('roadmap.added') });
          if (ok) {
            setForm(null);
            reload();
          }
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={t('roadmap.deleteTitle')}
        message={t('roadmap.deleteMessage', { title: deleting?.title ?? '' })}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await run(
            async () => {
              await roadmapApi.remove(deleting.id);
              return true;
            },
            { success: t('roadmap.removed') },
          );
          if (ok) {
            setDeleting(null);
            reload();
          }
        }}
      />
    </>
  );
}
