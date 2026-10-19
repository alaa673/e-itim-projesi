import clsx from 'clsx';
import { Check, Goal, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import goalFlag from '@/assets/illustrations/goal-flag.webp';
import { HandArrow } from '@/components/brand/Sparkle';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { AsyncContent } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { goalApi } from '../services/studentApi';
import type { StudentGoal } from '../types';

const SUGGESTIONS = ['goals.suggestions.s1', 'goals.suggestions.s2', 'goals.suggestions.s3'];

export default function GoalsPage() {
  const { t } = useTranslation(['student', 'common']);
  const { data, error, loading, reload } = useAsync((signal) => goalApi.list({ offset: 0, limit: 50 }, signal), []);
  const [label, setLabel] = useState('');
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();
  const goals = data?.items ?? [];
  const done = goals.filter((g) => g.done).length;
  const remaining = goals.length - done;

  const add = async (e?: FormEvent, text = label) => {
    e?.preventDefault();
    setTouched(true);
    if (text.trim().length < 3 || goals.length >= 10) return;
    const ok = await run(() => goalApi.create({ label: text.trim(), done: false }), { success: t('goals.added') });
    if (ok) {
      setLabel('');
      setTouched(false);
      reload();
    }
  };
  const toggle = async (g: StudentGoal) => {
    const ok = await run(() => goalApi.update(g.id, { done: !g.done }));
    if (ok) reload();
  };
  const remove = async (g: StudentGoal) => {
    const ok = await run(async () => {
      await goalApi.remove(g.id);
      return true;
    }, { success: t('goals.removed') });
    if (ok) reload();
  };

  return (
    <>
      <PageHeader title={t('nav.student.goals', { ns: 'common' })} description={t('goals.description')} />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {() => (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Panel icon={Goal} title={t('goals.thisWeek')}>
              <ul className="space-y-2.5">
                {goals.map((g) => (
                  <li key={g.id} className={clsx('flex items-center gap-3 rounded-[14px] border px-3 py-2.5 transition-colors', g.done ? 'border-success/30 bg-success/[0.06]' : 'border-border')}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={g.done}
                      onClick={() => void toggle(g)}
                      className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border-2 transition-colors', g.done ? 'border-[#6a9f1c] bg-[#6a9f1c] text-white' : 'border-input hover:border-primary')}
                      aria-label={g.label}
                    >
                      {g.done && <Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
                    </button>
                    <span className={clsx('flex-1 text-[15px]', g.done ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground')}>{g.label}</span>
                    <IconButton icon={Trash2} tone="danger" label={`${t('actions.delete', { ns: 'common' })}: ${g.label}`} onClick={() => void remove(g)} />
                  </li>
                ))}
              </ul>
              <form onSubmit={(e) => void add(e)} className="mt-4 flex items-start gap-2">
                <Input
                  containerClassName="flex-1"
                  label={t('goals.new')}
                  hideLabel
                  placeholder={t('goals.placeholder')}
                  value={label}
                  maxLength={80}
                  onChange={(e) => setLabel(e.target.value)}
                  error={touched && label.trim().length < 3 ? t('validation.tooShort', { ns: 'common' }) : goals.length >= 10 ? t('goals.max') : undefined}
                />
                <Button type="submit" loading={busy} icon={<Plus className="h-4 w-4" aria-hidden />} disabled={goals.length >= 10}>
                  {t('actions.add', { ns: 'common' })}
                </Button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-[13px] text-muted-foreground">{t('goals.ideas')}</span>
                {SUGGESTIONS.map((key) => (
                  <button key={key} type="button" className="rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold text-accent-ink hover:bg-primary/[0.14]" onClick={() => void add(undefined, t(key))}>
                    + {t(key)}
                  </button>
                ))}
              </div>
            </Panel>

            <section aria-labelledby="goal-summary" className="goal-card min-h-[280px] p-6">
              <img src={goalFlag} alt="" aria-hidden className="pointer-events-none absolute -bottom-2 right-0 h-[80%] w-auto select-none object-contain [mask-image:linear-gradient(90deg,transparent_0%,rgb(0_0_0/0.55)_30%,black_62%)]" />
              <h2 id="goal-summary" className="relative font-display text-[19px] font-extrabold">
                {t('goals.progressTitle')}
              </h2>
              <p className="relative mt-3">
                <span className="font-display text-[64px] font-extrabold leading-[0.9] tracking-[-0.04em]">{done}</span>
                <span className="font-display text-[34px] font-extrabold"> / {goals.length}</span>
              </p>
              <p className="relative mt-1 text-[15px] font-semibold">{t('dashboard.goal.done')}</p>
              <p className="hand relative mt-8 max-w-[60%] -rotate-3 text-[24px] leading-tight text-[#1d1433]/85">
                <HandArrow className="mr-1 inline h-5 w-12 -scale-x-100 text-[#1d1433]/70" />
                {goals.length === 0 ? t('goals.start') : remaining > 0 ? t('dashboard.goal.remaining', { count: remaining }) : t('dashboard.goal.complete')}
              </p>
            </section>
          </div>
        )}
      </AsyncContent>
    </>
  );
}
