import { CheckCircle2, PartyPopper, Pencil, Plus, User, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { FormModal } from '@/components/form/FormModal';
import { atLeastOne, dateString, required } from '@/components/form/validation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { formatDate, formatTime, toDateTimeLocal } from '@/utils/format';
import { type Activity, activityApi, rosterNames } from '../services/teacherApi';
import { useTeachingScope } from '../hooks/useTeachingScope';

const schema = z.object({ title: required(), kind: z.enum(['individual', 'group']), description: required(), classNames: atLeastOne(), date: dateString() });
type FormValues = z.infer<typeof schema>;
type View = 'planned' | 'done';

export default function ActivitiesPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const locale = useLocale();
  const scope = useTeachingScope();
  const { data, error, loading, reload } = useAsync((signal) => activityApi.list({ offset: 0, limit: 100, sortKey: 'date' }, signal), []);
  const [view, setView] = useState<View>('planned');
  const [editing, setEditing] = useState<{ item: Activity | null } | null>(null);
  const { run } = useAction();
  const items = (data?.items ?? []).filter((a) => a.status === view);

  return (
    <>
      <PageHeader
        title={t('nav.teacher.activities', { ns: 'common' })}
        description={t('activities.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ item: null })}>
            {t('activities.add')}
          </Button>
        }
      />
      <Tabs<View>
        className="mb-4"
        label={t('activities.viewLabel')}
        value={view}
        onChange={setView}
        items={[
          { value: 'planned', label: t('activities.status.planned') },
          { value: 'done', label: t('activities.status.done') },
        ]}
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {() =>
          items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<PartyPopper className="h-5 w-5" aria-hidden />} title={t('activities.empty')} />
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((a) => {
                const Icon = a.kind === 'group' ? UsersRound : User;
                return (
                  <li key={a.id} className="panel flex flex-col p-5">
                    <div className="flex items-start gap-3">
                      <span className={`icon-tile h-11 w-11 ${a.kind === 'group' ? 'bg-tint-mint text-ink-mint' : 'bg-tint-sky text-ink-sky'}`}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-[17px] font-extrabold text-foreground">{a.title}</h2>
                        <p className="text-[13px] text-muted-foreground">
                          {formatDate(a.date, locale, { day: 'numeric', month: 'long', weekday: 'short' })} · {formatTime(a.date, locale)}
                        </p>
                      </div>
                      <Badge tone={a.kind === 'group' ? 'success' : 'info'}>{t(`activities.kinds.${a.kind}`)}</Badge>
                    </div>
                    <p className="mt-3 text-[14px] leading-relaxed text-foreground">{a.description}</p>
                    <p className="mt-2 text-[13px] text-muted-foreground">
                      {a.classNames.join(', ')} · {t('activities.participants', { count: a.participants })}
                    </p>
                    <div className="mt-auto flex justify-end gap-2 pt-3">
                      <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${a.title}`} onClick={() => setEditing({ item: a })} />
                      {a.status === 'planned' && (
                        <Button
                          size="sm"
                          variant="soft"
                          icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
                          onClick={async () => {
                            const ok = await run(() => activityApi.update(a.id, { status: 'done' }), { success: t('activities.completed') });
                            if (ok) reload();
                          }}
                        >
                          {t('activities.markDone')}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        }
      </AsyncContent>
      <FormModal<FormValues>
        open={editing !== null}
        size="lg"
        title={editing?.item ? t('activities.editTitle') : t('activities.add')}
        schema={schema}
        defaultValues={
          editing?.item
            ? { title: editing.item.title, kind: editing.item.kind, description: editing.item.description, classNames: editing.item.classNames, date: toDateTimeLocal(editing.item.date) }
            : { title: '', kind: 'group', description: '', classNames: [], date: '' }
        }
        fields={[
          { name: 'title', label: t('common.title', { ns: 'common' }) },
          { name: 'kind', label: t('common.type', { ns: 'common' }), type: 'select', options: (['group', 'individual'] as const).map((v) => ({ value: v, label: t(`activities.kinds.${v}`) })) },
          { name: 'description', label: t('activities.instructions'), type: 'textarea', rows: 3 },
          { name: 'classNames', label: t('exams.classes'), type: 'checkboxes', options: scope.classNames.map((c) => ({ value: c, label: c })) },
          { name: 'date', label: t('common.date', { ns: 'common' }), type: 'datetime-local' },
        ]}
        submitLabel={t('actions.save', { ns: 'common' })}
        onClose={() => setEditing(null)}
        onSubmit={async (v) => {
          const current = editing?.item;
          const rosters = await Promise.all(v.classNames.map(rosterNames));
          const input = { ...v, date: new Date(v.date).toISOString(), participants: rosters.reduce((n, r) => n + r.length, 0), status: current?.status ?? ('planned' as const) };
          if (current) await activityApi.update(current.id, input);
          else await activityApi.create(input);
          setEditing(null);
          reload();
          await run(async () => null, { success: t('activities.saved') });
        }}
      />
    </>
  );
}
