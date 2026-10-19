import clsx from 'clsx';
import { CalendarRange, CheckCircle2, Pencil, Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { FormModal } from '@/components/form/FormModal';
import { dateString, required } from '@/components/form/validation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import type { Term } from '@/types';
import { daysFromToday, formatDate } from '@/utils/format';
import { type TermInput, termApi } from '../services/adminApi';

const schema = z
  .object({ year: z.string().trim().regex(/^\d{4}[–-]\d{4}$/, 'validation.yearRange'), name: required(), start: dateString(), end: dateString() })
  .refine((v) => v.end > v.start, { path: ['end'], message: 'validation.endAfterStart' });

const STATUS_TONE = { current: 'lime', upcoming: 'info', archived: 'neutral' } as const;

export default function TermsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const { data, error, loading, reload } = useAsync((signal) => termApi.list({ offset: 0, limit: 100, sortKey: 'start', sortDirection: 'desc' }, signal), []);
  const [editing, setEditing] = useState<{ term: Term | null } | null>(null);
  const [activating, setActivating] = useState<Term | null>(null);
  const { run, busy } = useAction();

  const byYear = (items: Term[]) => {
    const map = new Map<string, Term[]>();
    for (const term of items) map.set(term.year, [...(map.get(term.year) ?? []), term]);
    return [...map.entries()];
  };

  return (
    <>
      <PageHeader
        title={t('terms.title')}
        description={t('terms.description')}
        actions={
          <Button icon={<Plus className="h-4 w-4" aria-hidden />} onClick={() => setEditing({ term: null })}>
            {t('terms.add')}
          </Button>
        }
      />

      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(page) =>
          page.items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<CalendarRange className="h-5 w-5" aria-hidden />} title={t('terms.empty')} />
            </div>
          ) : (
            <div className="space-y-8">
              {byYear(page.items).map(([year, items]) => (
                <section key={year} aria-labelledby={`year-${year}`}>
                  <h2 id={`year-${year}`} className="section-title mb-3">
                    {t('terms.yearTitle', { year })}
                  </h2>
                  <ul className="grid gap-4 md:grid-cols-2">
                    {items.map((term) => {
                      const total = Math.max(1, (new Date(term.end).getTime() - new Date(term.start).getTime()) / 86_400_000);
                      const passed = Math.min(total, Math.max(0, -daysFromToday(term.start)));
                      const pct = term.status === 'current' ? Math.round((passed / total) * 100) : term.status === 'archived' ? 100 : 0;
                      return (
                        <li key={term.id} className={clsx('panel p-5', term.status === 'current' && 'ring-2 ring-lime')}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className={clsx('icon-tile h-12 w-12', term.status === 'current' ? 'bg-lime text-lime-foreground' : 'bg-tint-violet text-ink-violet')}>
                                {term.status === 'current' ? <Star className="h-5 w-5" aria-hidden /> : <CalendarRange className="h-5 w-5" aria-hidden />}
                              </span>
                              <div>
                                <h3 className="font-display text-[18px] font-extrabold text-foreground">{term.name}</h3>
                                <p className="text-[13.5px] text-muted-foreground">
                                  {formatDate(term.start, locale, { day: 'numeric', month: 'long', year: 'numeric' })} – {formatDate(term.end, locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <Badge tone={STATUS_TONE[term.status]} dot>
                              {t(`terms.status.${term.status}`)}
                            </Badge>
                          </div>
                          <div className="mt-4">
                            <div className="flex justify-between text-[12.5px] text-muted-foreground">
                              <span>{t('terms.progress')}</span>
                              <span className="tabular-nums">{t('common.percentValue', { ns: 'common', value: pct })}</span>
                            </div>
                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/[0.08]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${term.name} ${t('terms.progress')}`}>
                              <div className={clsx('h-full rounded-full', term.status === 'current' ? 'bg-lime-ink' : 'bg-primary/40')} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-end gap-2">
                            <IconButton icon={Pencil} label={`${t('actions.edit', { ns: 'common' })}: ${term.year} ${term.name}`} onClick={() => setEditing({ term })} disabled={term.status === 'archived'} />
                            {term.status === 'upcoming' && (
                              <Button size="sm" variant="soft" icon={<CheckCircle2 className="h-4 w-4" aria-hidden />} onClick={() => setActivating(term)}>
                                {t('terms.activate')}
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )
        }
      </AsyncContent>

      <FormModal<TermInput>
        open={editing !== null}
        title={editing?.term ? t('terms.editTitle') : t('terms.add')}
        schema={schema}
        defaultValues={editing?.term ? { year: editing.term.year, name: editing.term.name, start: editing.term.start.slice(0, 10), end: editing.term.end.slice(0, 10) } : { year: '2027–2028', name: '', start: '', end: '' }}
        fields={[
          { name: 'year', label: t('terms.year'), placeholder: '2027–2028', hint: t('terms.yearHint') },
          { name: 'name', label: t('terms.name'), placeholder: t('terms.namePlaceholder') },
          { name: 'start', label: t('common.start', { ns: 'common' }), type: 'date' },
          { name: 'end', label: t('common.end', { ns: 'common' }), type: 'date' },
        ]}
        submitLabel={t('actions.save', { ns: 'common' })}
        onClose={() => setEditing(null)}
        onSubmit={async (values) => {
          const current = editing?.term;
          if (current) await termApi.update(current.id, values);
          else await termApi.create(values);
          setEditing(null);
          reload();
          await run(async () => null, { success: t('terms.saved') });
        }}
      />

      <ConfirmDialog
        open={activating !== null}
        tone="primary"
        title={t('terms.activateTitle')}
        message={t('terms.activateMessage', { term: activating ? `${activating.year} ${activating.name}` : '' })}
        confirmLabel={t('terms.activate')}
        busy={busy}
        onCancel={() => setActivating(null)}
        onConfirm={async () => {
          if (!activating) return;
          await run(() => termApi.activate(activating.id), { success: t('terms.activated') });
          setActivating(null);
          reload();
        }}
      />
    </>
  );
}
