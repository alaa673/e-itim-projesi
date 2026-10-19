import clsx from 'clsx';
import { BookOpen, Check, ChevronRight, FolderPlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { FormModal } from '@/components/form/FormModal';
import { atLeastOne, intInRange, required } from '@/components/form/validation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { tempId } from '@/utils/id';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import type { SchoolLevel, Subject } from '@/types';
import { subjectIcon } from '@/features/student/subjectIcon';
import { type SubjectInput, subjectApi } from '../services/adminApi';

type Level = SchoolLevel | 'all';
const schema = z.object({ name: required(), levels: atLeastOne(), grades: atLeastOne(), weeklyHours: intInRange(1, 12) });
type FormValues = { name: string; levels: string[]; grades: string[]; weeklyHours: number };

/** Inline single-field editor used for unit and topic names. */
function InlineName({ initial, label, onSave, onCancel }: { initial: string; label: string; onSave: (v: string) => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initial);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSave(value.trim());
  };
  return (
    <form onSubmit={submit} className="flex flex-1 items-center gap-1">
      <Input label={label} hideLabel value={value} onChange={(e) => setValue(e.target.value)} autoFocus containerClassName="flex-1" className="h-9" onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), onCancel())} />
      <IconButton type="submit" icon={Check} tone="accent" label={t('actions.save')} />
      <IconButton icon={X} label={t('actions.cancel')} onClick={onCancel} />
    </form>
  );
}

export default function SubjectsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [level, setLevel] = useState<Level>('all');
  const { data, error, loading, reload } = useAsync((signal) => subjectApi.list({ offset: 0, limit: 200, sortKey: 'name', filters: { level: level === 'all' ? '' : level } }, signal), [level]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Subject | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [form, setForm] = useState<{ subject: Subject | null } | null>(null);
  const [deleting, setDeleting] = useState<{ unitId: string; topicId?: string; name: string } | null>(null);
  const { run, busy } = useAction();

  const items = useMemo(() => data?.items ?? [], [data]);
  useEffect(() => {
    if (!items.length) return;
    const found = items.find((s) => s.id === selectedId) ?? items[0];
    setSelectedId(found.id);
    setDraft(structuredClone(found));
  }, [items, selectedId]);

  const persist = async (next: Subject, message: string) => {
    setDraft(next);
    const saved = await run(() => subjectApi.update(next.id, { units: next.units }), { success: message });
    if (saved) reload();
  };

  const levelOptions: { value: Level; label: string }[] = [
    { value: 'all', label: t('common.all', { ns: 'common' }) },
    ...(['primary', 'middle', 'high'] as const).map((v) => ({ value: v, label: t(`levels.${v}`, { ns: 'common' }) })),
  ];

  return (
    <>
      <PageHeader
        title={t('subjects.title')}
        description={t('subjects.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setForm({ subject: null })}>
            {t('subjects.add')}
          </Button>
        }
      />
      <SegmentedControl className="mb-4" label={t('common.level', { ns: 'common' })} hideLabel value={level} onChange={setLevel} options={levelOptions} />

      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {() =>
          items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<BookOpen className="h-5 w-5" aria-hidden />} title={t('subjects.empty')} />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <nav aria-label={t('subjects.listLabel')} className="panel h-fit p-2">
                <ul>
                  {items.map((s) => {
                    const Icon = subjectIcon(s.name);
                    const topics = s.units.reduce((n, u) => n + u.topics.length, 0);
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          aria-current={s.id === selectedId ? 'true' : undefined}
                          onClick={() => setSelectedId(s.id)}
                          className={clsx('flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors', s.id === selectedId ? 'bg-accent-soft' : 'hover:bg-surface-muted')}
                        >
                          <span className="icon-tile h-10 w-10 bg-tint-violet text-ink-violet">
                            <Icon className="h-[18px] w-[18px]" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14.5px] font-semibold text-foreground">{s.name}</span>
                            <span className="block text-[12.5px] text-muted-foreground">{t('subjects.counts', { units: s.units.length, topics })}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {draft && (
                <Panel
                  title={draft.name}
                  description={t('subjects.meta', {
                    grades: draft.grades.map((g) => t('gradeLabel', { ns: 'common', grade: g })).join(', '),
                    hours: draft.weeklyHours,
                  })}
                  action={
                    <span className="flex gap-2">
                      <Button variant="secondary" size="sm" icon={<Pencil className="h-4 w-4" aria-hidden />} onClick={() => setForm({ subject: draft })}>
                        {t('actions.edit', { ns: 'common' })}
                      </Button>
                      <Button
                        variant="soft"
                        size="sm"
                        icon={<FolderPlus className="h-4 w-4" aria-hidden />}
                        onClick={() => setAdding('unit')}
                      >
                        {t('subjects.addUnit')}
                      </Button>
                    </span>
                  }
                >
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {draft.levels.map((l) => (
                      <Badge key={l} tone="accent">
                        {t(`levels.${l}`, { ns: 'common' })}
                      </Badge>
                    ))}
                  </div>
                  {adding === 'unit' && (
                    <div className="mb-3 rounded-[14px] border border-dashed border-primary/50 p-3">
                      <InlineName
                        initial=""
                        label={t('subjects.unitName')}
                        onCancel={() => setAdding(null)}
                        onSave={(name) => {
                          setAdding(null);
                          void persist({ ...draft, units: [...draft.units, { id: tempId('u'), name, topics: [] }] }, t('subjects.unitAdded', { name }));
                        }}
                      />
                    </div>
                  )}
                  {draft.units.length === 0 && adding !== 'unit' && <p className="py-6 text-center text-[14px] text-muted-foreground">{t('subjects.noUnits')}</p>}
                  <ol className="space-y-3">
                    {draft.units.map((unit, ui) => (
                      <li key={unit.id} className="rounded-[16px] border border-border">
                        <div className="flex items-center gap-2 border-b border-border bg-surface-muted/60 px-4 py-2.5">
                          <span className="text-[12.5px] font-bold tabular-nums text-muted-foreground">{ui + 1}.</span>
                          {editingName === unit.id ? (
                            <InlineName
                              initial={unit.name}
                              label={t('subjects.unitName')}
                              onCancel={() => setEditingName(null)}
                              onSave={(name) => {
                                setEditingName(null);
                                void persist({ ...draft, units: draft.units.map((u) => (u.id === unit.id ? { ...u, name } : u)) }, t('subjects.renamed'));
                              }}
                            />
                          ) : (
                            <>
                              <h3 className="flex-1 text-[15px] font-bold text-foreground">{unit.name}</h3>
                              <IconButton icon={Pencil} label={`${t('actions.rename', { ns: 'common' })}: ${unit.name}`} onClick={() => setEditingName(unit.id)} />
                              <IconButton icon={Plus} tone="accent" label={`${t('subjects.addTopic')}: ${unit.name}`} onClick={() => setAdding(unit.id)} />
                              <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${unit.name}`} onClick={() => setDeleting({ unitId: unit.id, name: unit.name })} />
                            </>
                          )}
                        </div>
                        <ul className="divide-y divide-border">
                          {unit.topics.map((topic) => (
                            <li key={topic.id} className="flex items-center gap-2 px-4 py-2">
                              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                              {editingName === topic.id ? (
                                <InlineName
                                  initial={topic.name}
                                  label={t('subjects.topicName')}
                                  onCancel={() => setEditingName(null)}
                                  onSave={(name) => {
                                    setEditingName(null);
                                    void persist(
                                      { ...draft, units: draft.units.map((u) => (u.id === unit.id ? { ...u, topics: u.topics.map((tp) => (tp.id === topic.id ? { ...tp, name } : tp)) } : u)) },
                                      t('subjects.renamed'),
                                    );
                                  }}
                                />
                              ) : (
                                <>
                                  <span className="flex-1 text-[14.5px] text-foreground">{topic.name}</span>
                                  <IconButton icon={Pencil} label={`${t('actions.rename', { ns: 'common' })}: ${topic.name}`} onClick={() => setEditingName(topic.id)} />
                                  <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${topic.name}`} onClick={() => setDeleting({ unitId: unit.id, topicId: topic.id, name: topic.name })} />
                                </>
                              )}
                            </li>
                          ))}
                          {adding === unit.id && (
                            <li className="px-4 py-2">
                              <InlineName
                                initial=""
                                label={t('subjects.topicName')}
                                onCancel={() => setAdding(null)}
                                onSave={(name) => {
                                  setAdding(null);
                                  void persist({ ...draft, units: draft.units.map((u) => (u.id === unit.id ? { ...u, topics: [...u.topics, { id: tempId('tp'), name }] } : u)) }, t('subjects.topicAdded', { name }));
                                }}
                              />
                            </li>
                          )}
                          {unit.topics.length === 0 && adding !== unit.id && <li className="px-4 py-3 text-[13.5px] text-muted-foreground">{t('subjects.noTopics')}</li>}
                        </ul>
                      </li>
                    ))}
                  </ol>
                </Panel>
              )}
            </div>
          )
        }
      </AsyncContent>

      <FormModal<FormValues>
        open={form !== null}
        title={form?.subject ? t('subjects.editTitle', { name: form.subject.name }) : t('subjects.add')}
        schema={schema as unknown as z.ZodType<FormValues>}
        defaultValues={
          form?.subject
            ? { name: form.subject.name, levels: form.subject.levels, grades: form.subject.grades.map(String), weeklyHours: form.subject.weeklyHours }
            : { name: '', levels: [], grades: [], weeklyHours: 4 }
        }
        fields={[
          { name: 'name', label: t('subjects.name') },
          { name: 'weeklyHours', label: t('subjects.weeklyHours'), type: 'number', min: 1, max: 12 },
          { name: 'levels', label: t('common.level', { ns: 'common' }), type: 'checkboxes', options: (['primary', 'middle', 'high'] as const).map((v) => ({ value: v, label: t(`levels.${v}`, { ns: 'common' }) })) },
          { name: 'grades', label: t('subjects.grades'), type: 'checkboxes', options: Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })) },
        ]}
        submitLabel={t('actions.save', { ns: 'common' })}
        onClose={() => setForm(null)}
        onSubmit={async (values) => {
          const input: SubjectInput = { name: values.name, levels: values.levels as SchoolLevel[], grades: values.grades.map(Number).sort((a, b) => a - b), weeklyHours: Number(values.weeklyHours) };
          const saved = form?.subject ? await subjectApi.update(form.subject.id, input) : await subjectApi.create(input);
          setForm(null);
          setSelectedId(saved.id);
          reload();
          await run(async () => null, { success: t('subjects.saved', { name: saved.name }) });
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={t('subjects.deleteTitle')}
        message={t('subjects.deleteMessage', { name: deleting?.name ?? '' })}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!draft || !deleting) return;
          const next: Subject = deleting.topicId
            ? { ...draft, units: draft.units.map((u) => (u.id === deleting.unitId ? { ...u, topics: u.topics.filter((tp) => tp.id !== deleting.topicId) } : u)) }
            : { ...draft, units: draft.units.filter((u) => u.id !== deleting.unitId) };
          setDeleting(null);
          await persist(next, t('subjects.deleted', { name: deleting.name }));
        }}
      />
    </>
  );
}
