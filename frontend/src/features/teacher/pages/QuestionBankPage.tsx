import clsx from 'clsx';
import { CheckCircle2, Eye, FilePlus2, Library, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Column } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { SimulatedNote } from '@/components/ui/SimulatedNote';
import { Textarea } from '@/components/ui/Textarea';
import { useAction } from '@/hooks/useAction';
import { useListQuery } from '@/hooks/useListQuery';
import { useStateFlag } from '@/hooks/useOpenParam';
import { useResourceList } from '@/hooks/useResourceList';
import type { Difficulty } from '@/types';
import { DIFF_TONE } from '@/config/catalog';
import { bankApi, type BankInput, type BankQuestion, generateQuestions } from '../services/teacherApi';
import { useTeachingScope } from '../hooks/useTeachingScope';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const SOURCE_TONE = { manual: 'neutral', archive: 'info', generated: 'accent' } as const;
type F = 'topic' | 'difficulty' | 'source' | 'status';

export function QuestionPreview({ q }: { q: Pick<BankQuestion, 'stem' | 'options' | 'answer'> }) {
  const { t } = useTranslation('common');
  return (
    <>
      <p className="whitespace-pre-line text-[15.5px] font-semibold leading-relaxed text-foreground">{q.stem}</p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2">
        {q.options.map((o, i) => {
          const correct = LETTERS[i] === q.answer;
          return (
            <li key={i} className={clsx('flex items-center gap-2.5 rounded-[12px] border px-3 py-2 text-[14px]', correct ? 'border-success bg-success/[0.08]' : 'border-border')}>
              <span className={clsx('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold', correct ? 'bg-success text-white' : 'bg-surface-muted')}>{LETTERS[i]}</span>
              <span className="flex-1">{o}</span>
              {correct && <CheckCircle2 className="h-4 w-4 text-success" aria-label={t('quiz.correctAnswer')} />}
            </li>
          );
        })}
      </ol>
    </>
  );
}

export default function QuestionBankPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const scope = useTeachingScope();
  const lq = useListQuery<F>({ sort: { key: 'createdAt', direction: 'desc' }, descFirst: ['createdAt', 'usedIn'] });
  const list = useResourceList(bankApi.list, lq.query);
  const [editing, setEditing] = useState<{ q: BankQuestion | null } | null>(null);
  const [preview, setPreview] = useState<BankQuestion | null>(null);
  const [deleting, setDeleting] = useState<BankQuestion | null>(null);
  const [generating, setGenerating] = useState(false);
  const { run, busy } = useAction();
  useStateFlag('openGenerate', () => setGenerating(true));

  const columns: Column<BankQuestion>[] = [
    {
      id: 'stem',
      header: t('bank.question'),
      rowHeader: true,
      cell: (q) => (
        <button type="button" onClick={() => setPreview(q)} className="block max-w-[420px] text-left">
          <span className="line-clamp-2 font-normal text-foreground hover:text-accent-ink">{q.stem}</span>
        </button>
      ),
    },
    { id: 'topic', header: t('common.topic', { ns: 'common' }), sortKey: 'topic', cell: (q) => <span className="whitespace-nowrap">{q.topic}</span> },
    { id: 'difficulty', header: t('common.difficulty', { ns: 'common' }), cell: (q) => <Badge tone={DIFF_TONE[q.difficulty]}>{t(`difficultyShort.${q.difficulty}`, { ns: 'common' })}</Badge> },
    { id: 'source', header: t('common.source', { ns: 'common' }), hideOnMobile: true, cell: (q) => <Badge tone={SOURCE_TONE[q.source]}>{t(`bank.sources.${q.source}`)}</Badge> },
    { id: 'status', header: t('common.status', { ns: 'common' }), cell: (q) => <Badge tone={q.status === 'approved' ? 'success' : 'warning'} dot>{t(`bank.status.${q.status}`)}</Badge> },
    { id: 'usedIn', header: t('bank.used'), sortKey: 'usedIn', align: 'right', hideOnMobile: true, cell: (q) => <span className="tabular-nums">{q.usedIn}</span> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (q) => (
        <span className="flex justify-end gap-1">
          <IconButton icon={Eye} label={`${t('actions.preview', { ns: 'common' })}: ${q.stem.slice(0, 40)}`} onClick={() => setPreview(q)} />
          <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${q.stem.slice(0, 40)}`} onClick={() => setEditing({ q })} />
          <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${q.stem.slice(0, 40)}`} onClick={() => setDeleting(q)} />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('nav.teacher.questionBank', { ns: 'common' })}
        description={t('bank.description')}
        actions={
          <>
            <Button variant="secondary" icon={<FilePlus2 className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ q: null })}>
              {t('bank.add')}
            </Button>
            <Button variant="ink" icon={<Sparkles className="h-4 w-4" aria-hidden />} onClick={() => setGenerating(true)}>
              {t('dashboard.prepareQuestions')}
            </Button>
          </>
        }
      />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('bank.searchPlaceholder')}
        filters={[
          { key: 'topic', label: t('common.topic', { ns: 'common' }), value: lq.filters.topic ?? '', allLabel: t('lessons.allTopics'), options: scope.allTopics.map((v) => ({ value: v, label: v })) },
          { key: 'difficulty', label: t('common.difficulty', { ns: 'common' }), value: lq.filters.difficulty ?? '', allLabel: t('common.all', { ns: 'common' }), options: (['easy', 'medium', 'hard'] as const).map((v) => ({ value: v, label: t(`difficultyShort.${v}`, { ns: 'common' }) })) },
          { key: 'source', label: t('common.source', { ns: 'common' }), value: lq.filters.source ?? '', allLabel: t('common.all', { ns: 'common' }), options: (['manual', 'archive', 'generated'] as const).map((v) => ({ value: v, label: t(`bank.sources.${v}`) })) },
          { key: 'status', label: t('common.status', { ns: 'common' }), value: lq.filters.status ?? '', allLabel: t('common.allStatuses', { ns: 'common' }), options: (['approved', 'draft'] as const).map((v) => ({ value: v, label: t(`bank.status.${v}`) })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as F, v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('nav.teacher.questionBank', { ns: 'common' })}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={preview?.id ?? editing?.q?.id ?? null}
        empty={{ icon: <Library className="h-5 w-5" aria-hidden />, title: t('bank.empty') }}
      />

      <QuestionEditor
        open={editing !== null}
        question={editing?.q ?? null}
        onClose={() => setEditing(null)}
        onSaved={(saved, created) => {
          setEditing(null);
          if (created) list.refresh();
          else list.updateItem(saved);
        }}
      />
      <Generator open={generating} onClose={() => setGenerating(false)} onAdded={() => list.refresh()} />

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        variant="side"
        title={preview ? `${preview.topic} · ${t(`difficultyShort.${preview.difficulty}`, { ns: 'common' })}` : ''}
        description={preview ? t(`bank.sources.${preview.source}`) : undefined}
        footer={
          preview?.status === 'draft' && (
            <Button
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
              loading={busy}
              onClick={async () => {
                const saved = await run(() => bankApi.update(preview.id, { status: 'approved' }), { success: t('bank.approved') });
                if (saved) {
                  list.updateItem(saved);
                  setPreview(saved);
                }
              }}
            >
              {t('bank.approve')}
            </Button>
          )
        }
      >
        {preview && <QuestionPreview q={preview} />}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={t('bank.deleteTitle')}
        message={t('bank.deleteMessage')}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await run(async () => {
            await bankApi.remove(deleting.id);
            return true;
          }, { success: t('bank.deleted') });
          setDeleting(null);
          if (ok) list.refresh();
        }}
      />
    </>
  );
}

const EMPTY: BankInput = { stem: '', options: ['', '', '', ''], answer: 'A', subject: '', topic: '', difficulty: 'medium', source: 'manual', status: 'approved' };

function QuestionEditor({ open, question, onClose, onSaved }: { open: boolean; question: BankQuestion | null; onClose: () => void; onSaved: (q: BankQuestion, created: boolean) => void }) {
  const { t } = useTranslation(['teacher', 'common']);
  const scope = useTeachingScope();
  const [form, setForm] = useState<BankInput>(EMPTY);
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();
  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setForm(question ? { stem: question.stem, options: [...question.options], answer: question.answer, subject: question.subject, topic: question.topic, difficulty: question.difficulty, source: question.source, status: question.status } : EMPTY);
  }, [open, question]);
  const req = (v: string) => (touched && !v.trim() ? t('validation.required', { ns: 'common' }) : undefined);
  const invalid = !form.stem.trim() || !form.topic || form.options.some((o) => !o.trim()) || new Set(form.options.map((o) => o.trim())).size !== form.options.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      preventClose={busy}
      title={question ? t('bank.editTitle') : t('bank.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            loading={busy}
            onClick={async () => {
              setTouched(true);
              if (invalid) return;
              const input = { ...form, subject: form.subject || scope.subjectOf() };
              const saved = await run(() => (question ? bankApi.update(question.id, input) : bankApi.create(input)), { success: t('bank.saved') });
              if (saved) onSaved(saved, !question);
            }}
          >
            {t('actions.save', { ns: 'common' })}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Textarea label={t('bank.question')} rows={3} value={form.stem} onChange={(e) => setForm({ ...form, stem: e.target.value })} error={req(form.stem)} />
        <div className="grid gap-2 sm:grid-cols-2">
          {form.options.map((o, i) => (
            <Input
              key={i}
              label={t('bank.option', { letter: LETTERS[i] })}
              value={o}
              leading={<span className="text-[13px] font-bold">{LETTERS[i]})</span>}
              onChange={(e) => setForm({ ...form, options: form.options.map((x, j) => (j === i ? e.target.value : x)) })}
              error={req(o)}
            />
          ))}
        </div>
        {touched && new Set(form.options.map((o) => o.trim())).size !== form.options.length && form.options.every((o) => o.trim()) && <p className="text-[13px] text-danger">{t('bank.duplicateOptions')}</p>}
        <SegmentedControl label={t('common.answer', { ns: 'common' })} value={form.answer} onChange={(v) => setForm({ ...form, answer: v })} options={form.options.map((_, i) => ({ value: LETTERS[i], label: LETTERS[i] }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('common.topic', { ns: 'common' })}
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholderOption={t('common.selectPlaceholder', { ns: 'common' })}
            options={scope.allTopics.map((v) => ({ value: v, label: v }))}
            error={touched && !form.topic ? t('validation.required', { ns: 'common' }) : undefined}
          />
          <Select label={t('common.difficulty', { ns: 'common' })} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })} options={(['easy', 'medium', 'hard'] as const).map((v) => ({ value: v, label: t(`difficultyShort.${v}`, { ns: 'common' }) }))} />
        </div>
      </div>
    </Modal>
  );
}

function Generator({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const { t } = useTranslation(['teacher', 'common']);
  const scope = useTeachingScope();
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState('5');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [result, setResult] = useState<{ questions: BankQuestion[]; simulated: boolean } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const { run, busy } = useAction();
  useEffect(() => {
    if (open) {
      setResult(null);
      setSelected([]);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      preventClose={busy}
      title={t('dashboard.prepareQuestions')}
      description={t('bank.generateHint')}
      footer={
        result ? (
          <>
            <Button variant="ghost" className="mr-auto" onClick={() => setResult(null)} disabled={busy}>
              {t('bank.again')}
            </Button>
            <Button
              loading={busy}
              disabled={selected.length === 0}
              onClick={async () => {
                const picked = result.questions.filter((q) => selected.includes(q.id));
                const ok = await run(async () => {
                  for (const q of picked) await bankApi.create({ stem: q.stem, options: q.options, answer: q.answer, subject: q.subject, topic: q.topic, difficulty: q.difficulty, source: 'generated', status: 'approved' });
                  return true;
                }, { success: t('bank.addedFromAi', { count: picked.length }) });
                if (ok) {
                  onAdded();
                  onClose();
                }
              }}
            >
              {t('bank.addSelected', { count: selected.length })}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button
              variant="ink"
              loading={busy}
              disabled={!topic}
              icon={<Sparkles className="h-4 w-4" aria-hidden />}
              onClick={async () => {
                const res = await run(() => generateQuestions({ topic, count: Number(count), difficulty }));
                if (res) {
                  setResult(res);
                  setSelected(res.questions.map((q) => q.id));
                }
              }}
            >
              {t('bank.generate')}
            </Button>
          </>
        )
      }
    >
      {!result ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label={t('common.topic', { ns: 'common' })} value={topic} onChange={(e) => setTopic(e.target.value)} options={scope.allTopics.map((v) => ({ value: v, label: v }))} placeholderOption={t('common.selectPlaceholder', { ns: 'common' })} />
          <SegmentedControl label={t('common.questionCount', { ns: 'common' })} value={count} onChange={setCount} options={['5', '10', '15'].map((v) => ({ value: v, label: v }))} />
          <SegmentedControl label={t('common.difficulty', { ns: 'common' })} value={difficulty} onChange={setDifficulty} options={(['easy', 'medium', 'hard'] as const).map((v) => ({ value: v, label: t(`difficultyShort.${v}`, { ns: 'common' }) }))} />
          <p className="text-[13px] text-muted-foreground sm:col-span-3">{t('bank.reviewRule')}</p>
        </div>
      ) : (
        <div>
          <SimulatedNote show={result.simulated} className="mb-4" />
          <ul className="space-y-3">
            {result.questions.map((q, i) => (
              <li key={q.id} className={clsx('rounded-[16px] border p-4', selected.includes(q.id) ? 'border-primary/50 bg-accent-soft/40' : 'border-border')}>
                <Checkbox
                  label={t('bank.includeQuestion', { number: i + 1 })}
                  checked={selected.includes(q.id)}
                  onChange={(e) => setSelected(e.target.checked ? [...selected, q.id] : selected.filter((x) => x !== q.id))}
                />
                <div className="mt-3">
                  <QuestionPreview q={q} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
