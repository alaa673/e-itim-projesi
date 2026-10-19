import clsx from 'clsx';
import { Check, Heart, Save, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { useAuth } from '@/app/providers/authContext';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Panel } from '@/components/ui/Panel';
import { AsyncContent } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { interestApi } from '../services/studentApi';
import type { InterestProfile } from '../types';

export const INTERESTS = ['technology', 'science', 'health', 'math', 'art', 'design', 'music', 'sports', 'nature', 'business', 'law', 'education', 'languages', 'social', 'history', 'games'] as const;
export const SKILLS = ['analytical', 'creative', 'communication', 'teamwork', 'languages', 'handsOn'] as const;

export default function InterestsPage() {
  const { t } = useTranslation(['student', 'common']);
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync((signal) => interestApi.get(signal), []);
  const [draft, setDraft] = useState<InterestProfile | null>(null);
  const { run, busy } = useAction();
  useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  const dirty = Boolean(draft && data && JSON.stringify(draft) !== JSON.stringify(data));
  const toggle = (key: string) => draft && setDraft({ ...draft, interests: draft.interests.includes(key) ? draft.interests.filter((k) => k !== key) : [...draft.interests, key] });

  return (
    <>
      <PageHeader title={t('nav.student.interests', { ns: 'common' })} description={t('interests.description')} />
      <AsyncContent data={draft} error={error} loading={loading} reload={reload}>
        {(d) => (
          <>
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel icon={Heart} title={t('interests.title')} description={t('interests.pickHint', { count: d.interests.length })}>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t('interests.title')}>
                  {INTERESTS.map((key) => {
                    const on = d.interests.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(key)}
                        className={clsx('inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-[14px] font-semibold transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:border-primary/40')}
                      >
                        {on && <Check className="h-4 w-4" aria-hidden />}
                        {t(`interests.items.${key}`)}
                      </button>
                    );
                  })}
                </div>
              </Panel>
              <Panel icon={Sparkles} title={t('interests.skillsTitle')} description={t('interests.skillsHint')}>
                <ul className="space-y-4">
                  {d.skills.map((s) => (
                    <li key={s.key}>
                      <fieldset>
                        <legend className="mb-1.5 text-[14.5px] font-semibold text-foreground">{t(`interests.skills.${s.key}`)}</legend>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <label key={level} className={clsx('flex h-10 flex-1 cursor-pointer items-center justify-center rounded-[10px] border-2 text-[14px] font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring', level <= s.level ? 'border-primary bg-accent-soft text-accent-ink' : 'border-border text-muted-foreground hover:border-primary/40')}>
                              <input type="radio" className="sr-only" name={`skill-${s.key}`} checked={s.level === level} onChange={() => setDraft({ ...d, skills: d.skills.map((x) => (x.key === s.key ? { ...x, level } : x)) })} />
                              <span className="sr-only">{t('interests.level', { level })}</span>
                              <span aria-hidden>{level}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[12.5px] text-muted-foreground">{t('interests.scale')}</p>
              </Panel>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-muted-foreground">
                {d.updatedAt ? (
                  <>
                    {t('interests.updated')}: <RelativeTime iso={d.updatedAt} />
                  </>
                ) : (
                  t('interests.never')
                )}
              </p>
              <div className="flex gap-2">
                {user?.level === 'high' && (
                  <Link to="/student/guidance/majors" className={buttonClass('secondary')}>
                    {t('interests.toMajors')}
                  </Link>
                )}
                <Button
                  variant="ink"
                  loading={busy}
                  disabled={!dirty || d.interests.length === 0}
                  icon={<Save className="h-4 w-4" aria-hidden />}
                  onClick={async () => {
                    const saved = await run(() => interestApi.save(d), { success: t('interests.saved') });
                    if (saved) reload();
                  }}
                >
                  {t('actions.save', { ns: 'common' })}
                </Button>
              </div>
            </div>
          </>
        )}
      </AsyncContent>
    </>
  );
}
