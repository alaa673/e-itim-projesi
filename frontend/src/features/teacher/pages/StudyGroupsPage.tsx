import { Pencil, Plus, Sparkles, Trash2, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { Textarea } from '@/components/ui/Textarea';
import { TOPIC_REVIEW_THRESHOLD } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { groupApi, type GroupInput, studentInsightApi, type StudyGroup } from '../services/teacherApi';
import { useTeachingScope } from '../hooks/useTeachingScope';

export default function StudyGroupsPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const { data, error, loading, reload } = useAsync((signal) => groupApi.list({ offset: 0, limit: 100, sortKey: 'createdAt', sortDirection: 'desc' }, signal), []);
  const [editing, setEditing] = useState<{ group: StudyGroup | null } | null>(null);
  const [deleting, setDeleting] = useState<StudyGroup | null>(null);
  const { run, busy } = useAction();

  return (
    <>
      <PageHeader
        title={t('nav.teacher.studyGroups', { ns: 'common' })}
        description={t('groups.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ group: null })}>
            {t('groups.add')}
          </Button>
        }
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(page) =>
          page.items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<UsersRound className="h-5 w-5" aria-hidden />} title={t('groups.empty')} description={t('groups.emptyHint')} />
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {page.items.map((g) => (
                <li key={g.id} className="panel flex flex-col p-5">
                  <div className="flex items-start gap-3">
                    <span className="icon-tile h-11 w-11 bg-tint-mint text-ink-mint">
                      <UsersRound className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-[17px] font-extrabold text-foreground">{g.name}</h2>
                      <p className="text-[13px] text-muted-foreground">
                        {g.className} · <RelativeTime iso={g.createdAt} />
                      </p>
                    </div>
                    <Badge tone="accent">{g.topic}</Badge>
                  </div>
                  <div className="mt-4 flex -space-x-2" aria-label={t('groups.members', { count: g.members.length })}>
                    {g.members.slice(0, 6).map((m) => (
                      <span key={m} className="rounded-full ring-2 ring-surface" title={m}>
                        <Avatar name={m} size={34} />
                      </span>
                    ))}
                    {g.members.length > 6 && <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface-muted text-[12px] font-bold text-foreground ring-2 ring-surface">+{g.members.length - 6}</span>}
                  </div>
                  <p className="mt-2 text-[13px] text-muted-foreground">{t('groups.members', { count: g.members.length })}</p>
                  {g.note && <p className="mt-2 text-[14px] text-foreground">{g.note}</p>}
                  <div className="mt-auto flex justify-end gap-1 pt-3">
                    <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${g.name}`} onClick={() => setEditing({ group: g })} />
                    <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${g.name}`} onClick={() => setDeleting(g)} />
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </AsyncContent>

      <GroupForm
        open={editing !== null}
        group={editing?.group ?? null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('groups.deleteTitle')}
        message={t('groups.deleteMessage', { name: deleting?.name ?? '' })}
        confirmLabel={t('actions.delete', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await run(async () => {
            await groupApi.remove(deleting.id);
            return true;
          }, { success: t('groups.deleted') });
          setDeleting(null);
          if (ok) reload();
        }}
      />
    </>
  );
}

function GroupForm({ open, group, onClose, onSaved }: { open: boolean; group: StudyGroup | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation(['teacher', 'common']);
  const scope = useTeachingScope();
  const [form, setForm] = useState<GroupInput>({ name: '', className: '', topic: '', members: [], note: '' });
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();
  const roster = useAsync(
    (signal) => (form.className ? studentInsightApi.list({ offset: 0, limit: 60, filters: { className: form.className }, sortKey: 'name' }, signal) : Promise.resolve(null)),
    [form.className],
  );

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setForm(group ? { name: group.name, className: group.className, topic: group.topic, members: group.members, note: group.note } : { name: '', className: scope.classNames[0] ?? '', topic: '', members: [], note: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, group]);

  const suggestions = useMemo(
    () => (roster.data?.items ?? []).filter((s) => s.topics.some((tp) => tp.name === form.topic && tp.percent < TOPIC_REVIEW_THRESHOLD)).map((s) => s.name),
    [roster.data, form.topic],
  );
  const errors = { name: !form.name.trim(), topic: !form.topic, members: form.members.length < 2 };
  const invalid = Object.values(errors).some(Boolean);

  const save = async () => {
    setTouched(true);
    if (invalid) return;
    const ok = await run(() => (group ? groupApi.update(group.id, form) : groupApi.create(form)), { success: t('groups.saved', { name: form.name }) });
    if (ok) onSaved();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      preventClose={busy}
      title={group ? t('groups.editTitle') : t('groups.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button loading={busy} onClick={() => void save()}>
            {t('actions.save', { ns: 'common' })}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t('groups.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={touched && errors.name ? t('validation.required', { ns: 'common' }) : undefined} />
        <Select
          label={t('common.class', { ns: 'common' })}
          value={form.className}
          disabled={Boolean(group)}
          onChange={(e) => setForm({ ...form, className: e.target.value, members: [], topic: '' })}
          options={scope.classNames.map((c) => ({ value: c, label: c }))}
        />
        <Select
          containerClassName="sm:col-span-2"
          label={t('common.topic', { ns: 'common' })}
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
          placeholderOption={t('common.selectPlaceholder', { ns: 'common' })}
          options={scope.topicsFor(form.className).map((tp) => ({ value: tp, label: tp }))}
          error={touched && errors.topic ? t('validation.required', { ns: 'common' }) : undefined}
        />
      </div>
      <fieldset className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <legend className="field-label mb-0">{t('groups.pickMembers', { count: form.members.length })}</legend>
          <Button
            size="sm"
            variant="soft"
            icon={<Sparkles className="h-4 w-4" aria-hidden />}
            disabled={!form.topic || suggestions.length === 0}
            onClick={() => setForm({ ...form, members: [...new Set([...form.members, ...suggestions])] })}
          >
            {t('groups.suggest', { count: suggestions.length })}
          </Button>
        </div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">{t('groups.suggestHint', { value: TOPIC_REVIEW_THRESHOLD })}</p>
        <div className="scrollbar-thin mt-3 grid max-h-[260px] gap-2 overflow-y-auto rounded-[14px] border border-border p-3 sm:grid-cols-2">
          {(roster.data?.items ?? []).map((s) => {
            const tp = s.topics.find((x) => x.name === form.topic);
            return (
              <Checkbox
                key={s.id}
                label={s.name}
                description={tp ? `${form.topic}: ${t('common.percentValue', { ns: 'common', value: tp.percent })}` : undefined}
                checked={form.members.includes(s.name)}
                onChange={(e) => setForm({ ...form, members: e.target.checked ? [...form.members, s.name] : form.members.filter((m) => m !== s.name) })}
              />
            );
          })}
        </div>
        {touched && errors.members && <p className="mt-2 text-[13px] text-danger">{t('groups.minMembers')}</p>}
      </fieldset>
      <Textarea containerClassName="mt-4" label={`${t('common.notes', { ns: 'common' })} (${t('common.optional', { ns: 'common' })})`} rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
    </Modal>
  );
}
