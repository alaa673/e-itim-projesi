import clsx from 'clsx';
import { Copy, Grid3X3, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { Textarea } from '@/components/ui/Textarea';
import { tempId } from '@/utils/id';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { type Rubric, rubricApi, type RubricInput } from '../services/teacherApi';

type Criterion = Rubric['criteria'][number];
const newCriterion = (labels: string[]): Criterion => ({
  id: tempId('c'),
  name: '',
  weight: 25,
  levels: labels.map((label, i) => ({ label, points: i + 1, description: '' })),
});

export function RubricMatrix({ rubric }: { rubric: Pick<Rubric, 'criteria' | 'title'> }) {
  const { t } = useTranslation(['teacher', 'common']);
  const levels = rubric.criteria[0]?.levels ?? [];
  return (
    <div className="relative overflow-x-auto rounded-[14px] border border-border">
      <table className="w-full min-w-[640px] text-left text-[13.5px]">
        <caption className="sr-only">{rubric.title}</caption>
        <thead className="bg-surface-muted text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-semibold">{t('rubrics.criterion')}</th>
            {levels.map((l) => (
              <th key={l.label} scope="col" className="px-3 py-2.5 font-semibold">
                {l.label} <span className="font-normal">({t('rubrics.points', { count: l.points })})</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rubric.criteria.map((c) => (
            <tr key={c.id} className="border-t border-border align-top">
              <th scope="row" className="px-4 py-2.5 font-semibold text-foreground">
                {c.name}
                <span className="block text-[12px] font-normal text-muted-foreground">{t('rubrics.weightValue', { value: c.weight })}</span>
              </th>
              {c.levels.map((l) => (
                <td key={l.label} className="px-3 py-2.5 text-foreground">
                  {l.description || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RubricsPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const { data, error, loading, reload } = useAsync((signal) => rubricApi.list({ offset: 0, limit: 100, sortKey: 'updatedAt', sortDirection: 'desc' }, signal), []);
  const [editing, setEditing] = useState<{ item: Rubric | null; copy?: boolean } | null>(null);
  const [deleting, setDeleting] = useState<Rubric | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const { run, busy } = useAction();

  return (
    <>
      <PageHeader
        title={t('nav.teacher.rubrics', { ns: 'common' })}
        description={t('rubrics.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ item: null })}>
            {t('rubrics.add')}
          </Button>
        }
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(page) =>
          page.items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<Grid3X3 className="h-5 w-5" aria-hidden />} title={t('rubrics.empty')} />
            </div>
          ) : (
            <ul className="space-y-4">
              {page.items.map((r) => (
                <li key={r.id} className="panel p-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="icon-tile h-11 w-11 bg-tint-violet text-ink-violet">
                      <Grid3X3 className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-[17px] font-extrabold text-foreground">{r.title}</h2>
                      <p className="text-[13px] text-muted-foreground">
                        {r.description} · {t('rubrics.criteria', { count: r.criteria.length })} · {t('rubrics.usedIn', { count: r.usedIn })} · <RelativeTime iso={r.updatedAt} />
                      </p>
                    </div>
                    <span className="flex gap-1">
                      <Button size="sm" variant="ghost" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>
                        {open === r.id ? t('rubrics.hide') : t('rubrics.show')}
                      </Button>
                      <IconButton icon={Copy} label={`${t('actions.duplicate', { ns: 'common' })}: ${r.title}`} onClick={() => setEditing({ item: r, copy: true })} />
                      <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${r.title}`} onClick={() => setEditing({ item: r })} />
                      <IconButton icon={Trash2} tone="danger" disabled={r.usedIn > 0} label={`${t('actions.delete', { ns: 'common' })}: ${r.title}`} title={r.usedIn > 0 ? t('rubrics.inUse') : undefined} onClick={() => setDeleting(r)} />
                    </span>
                  </div>
                  {open === r.id && (
                    <div className="mt-4">
                      <RubricMatrix rubric={r} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )
        }
      </AsyncContent>
      <RubricEditor
        open={editing !== null}
        item={editing?.item ?? null}
        copy={editing?.copy ?? false}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('rubrics.deleteTitle')}
        message={t('rubrics.deleteMessage', { title: deleting?.title ?? '' })}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await run(async () => {
            await rubricApi.remove(deleting.id);
            return true;
          }, { success: t('rubrics.deleted') });
          setDeleting(null);
          if (ok) reload();
        }}
      />
    </>
  );
}

function RubricEditor({ open, item, copy, onClose, onSaved }: { open: boolean; item: Rubric | null; copy: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation(['teacher', 'common']);
  const defaultLevels = [t('rubrics.levels.l1'), t('rubrics.levels.l2'), t('rubrics.levels.l3'), t('rubrics.levels.l4')];
  const [form, setForm] = useState<RubricInput>({ title: '', description: '', criteria: [] });
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setForm(
      item
        ? { title: copy ? t('rubrics.copyOf', { title: item.title }) : item.title, description: item.description, criteria: structuredClone(item.criteria) }
        : { title: '', description: '', criteria: [newCriterion(defaultLevels), newCriterion(defaultLevels)].map((c, i) => ({ ...c, weight: i === 0 ? 60 : 40 })) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item, copy]);

  const total = form.criteria.reduce((n, c) => n + Number(c.weight || 0), 0);
  const invalid = !form.title.trim() || form.criteria.length === 0 || form.criteria.some((c) => !c.name.trim()) || total !== 100;
  const setCrit = (i: number, patch: Partial<Criterion>) => setForm((f) => ({ ...f, criteria: f.criteria.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      preventClose={busy}
      title={item && !copy ? t('rubrics.editTitle') : t('rubrics.add')}
      footer={
        <>
          <span className={clsx('mr-auto text-[13.5px] font-semibold', total === 100 ? 'text-success' : 'text-danger')} aria-live="polite">
            {t('rubrics.total', { value: total })}
          </span>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            loading={busy}
            onClick={async () => {
              setTouched(true);
              if (invalid) return;
              const input = { ...form, criteria: form.criteria.map((c) => ({ ...c, weight: Number(c.weight) })) };
              const ok = await run(() => (item && !copy ? rubricApi.update(item.id, input) : rubricApi.create(input)), { success: t('rubrics.saved') });
              if (ok) onSaved();
            }}
          >
            {t('actions.save', { ns: 'common' })}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t('common.title', { ns: 'common' })} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={touched && !form.title.trim() ? t('validation.required', { ns: 'common' }) : undefined} />
        <Input label={t('common.description', { ns: 'common' })} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      {touched && total !== 100 && <p className="mt-3 text-[13px] text-danger">{t('rubrics.weightRule')}</p>}
      <ol className="mt-5 space-y-4">
        {form.criteria.map((c, i) => (
          <li key={c.id} className="rounded-[16px] border border-border p-4">
            <div className="flex items-end gap-3">
              <Input containerClassName="flex-1" label={t('rubrics.criterionN', { number: i + 1 })} value={c.name} onChange={(e) => setCrit(i, { name: e.target.value })} error={touched && !c.name.trim() ? t('validation.required', { ns: 'common' }) : undefined} />
              <Input containerClassName="w-[110px]" label={t('rubrics.weight')} type="number" min={0} max={100} value={c.weight} onChange={(e) => setCrit(i, { weight: Number(e.target.value) })} />
              <IconButton size="md" icon={X} tone="danger" label={t('rubrics.removeCriterion', { number: i + 1 })} onClick={() => setForm({ ...form, criteria: form.criteria.filter((_, j) => j !== i) })} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {c.levels.map((l, li) => (
                <Textarea
                  key={li}
                  label={`${l.label} (${t('rubrics.points', { count: l.points })})`}
                  rows={2}
                  value={l.description}
                  onChange={(e) => setCrit(i, { levels: c.levels.map((x, k) => (k === li ? { ...x, description: e.target.value } : x)) })}
                />
              ))}
            </div>
          </li>
        ))}
      </ol>
      <Button className="mt-4" variant="soft" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setForm({ ...form, criteria: [...form.criteria, { ...newCriterion(defaultLevels), weight: Math.max(0, 100 - total) }] })}>
        {t('rubrics.addCriterion')}
      </Button>
    </Modal>
  );
}
