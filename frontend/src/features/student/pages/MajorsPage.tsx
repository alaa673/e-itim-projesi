import clsx from 'clsx';
import { ArrowRight, BriefcaseBusiness, GraduationCap, Heart, Info, Pencil, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Meter } from '@/components/charts/Meter';
import { TONE_TILE, type Tone } from '@/components/dashboard/tones';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { buttonClass } from '@/components/ui/buttonStyles';
import { DemoDataNote } from '@/components/ui/DemoDataNote';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { useAsync } from '@/hooks/useAsync';
import { interestApi, majorSuggestions } from '../services/studentApi';
import type { MajorSuggestion } from '../types';

const FIELD_TONE: Record<string, Tone> = {
  Bilişim: 'violet',
  Mühendislik: 'sky',
  Sağlık: 'mint',
  Tasarım: 'peach',
  Hukuk: 'violet',
  'Sosyal Bilimler': 'peach',
  Eğitim: 'mint',
  Dil: 'sky',
  İşletme: 'peach',
};

export default function MajorsPage() {
  const { t } = useTranslation(['student', 'common']);
  const data = useAsync(async (signal) => {
    const [profile, items] = await Promise.all([interestApi.get(signal), majorSuggestions(signal)]);
    return { profile, items };
  }, []);

  return (
    <>
      <PageHeader
        title={t('nav.student.majors', { ns: 'common' })}
        description={t('majors.description')}
        actions={
          <Link to="/student/guidance/interests" className={buttonClass('secondary')}>
            <Pencil className="h-4 w-4" aria-hidden />
            {t('majors.editProfile')}
          </Link>
        }
      />
      <DemoDataNote />
      <AsyncContent data={data.data} error={data.error} loading={data.loading} reload={data.reload}>
        {({ profile, items }) => (
          <>
            <section aria-labelledby="majors-profile" className="panel mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
              <h2 id="majors-profile" className="flex items-center gap-2 font-display text-[16px] font-extrabold text-foreground">
                <Heart className="h-5 w-5 text-primary" aria-hidden />
                {t('majors.basedOn')}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {profile.interests.map((key) => (
                  <li key={key} className="rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold text-accent-ink">
                    {t(`interests.items.${key}`)}
                  </li>
                ))}
                {profile.skills
                  .filter((s) => s.level >= 4)
                  .map((s) => (
                    <li key={s.key} className="rounded-full bg-tint-mint px-3 py-1 text-[13px] font-semibold text-ink-mint">
                      {t(`interests.skills.${s.key}`)} · {s.level}/5
                    </li>
                  ))}
              </ul>
              <p className="flex basis-full items-start gap-2 text-[13px] text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {t('majors.method')}
              </p>
            </section>

            {items.length === 0 ? (
              <div className="panel">
                <EmptyState
                  icon={<Sparkles className="h-6 w-6" aria-hidden />}
                  title={t('majors.empty')}
                  description={t('majors.emptyHint')}
                  action={
                    <Link to="/student/guidance/interests" className={buttonClass('primary')}>
                      {t('majors.editProfile')}
                    </Link>
                  }
                />
              </div>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {items.map((m, i) => (
                  <MajorCard key={m.id} major={m} top={i < 3} />
                ))}
              </ul>
            )}
          </>
        )}
      </AsyncContent>
    </>
  );
}

function MajorCard({ major, top }: { major: MajorSuggestion; top: boolean }) {
  const { t } = useTranslation(['student', 'common']);
  const tone = FIELD_TONE[major.field] ?? 'violet';
  return (
    <li className={clsx('panel flex flex-col p-5', top && 'ring-2 ring-primary/25')}>
      <div className="flex items-start gap-3">
        <span className={clsx('icon-tile h-12 w-12 shrink-0', TONE_TILE[tone])}>
          <GraduationCap className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[17px] font-extrabold leading-snug text-foreground">{major.name}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
            {major.field}
            <Badge tone="neutral">{major.scoreType}</Badge>
            {top && <Badge tone="accent">{t('majors.topPick')}</Badge>}
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block font-display text-[26px] font-extrabold leading-none text-foreground">%{major.match}</span>
          <span className="text-[12px] text-muted-foreground">{t('majors.match')}</span>
        </p>
      </div>
      <Meter className="mt-3" value={major.match} label={t('majors.matchAria', { name: major.name, value: major.match })} tone={major.match >= 70 ? 'success' : major.match >= 50 ? 'role' : 'warning'} size="sm" />

      {major.reasons.length > 0 && (
        <div className="mt-4">
          <h3 className="text-[12.5px] font-bold uppercase tracking-wide text-muted-foreground">{t('majors.why')}</h3>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {major.reasons.map((r) => (
              <li key={`${r.kind}-${r.key}`} className={clsx('rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold', r.kind === 'interest' ? 'bg-accent-soft text-accent-ink' : 'bg-tint-mint text-ink-mint')}>
                {r.kind === 'interest' ? t(`interests.items.${r.key}`) : t(`interests.skills.${r.key}`)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {major.careers.length > 0 && (
        <p className="mt-3 flex items-start gap-2 text-[13.5px] text-foreground">
          <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            <span className="sr-only">{t('majors.careers')}: </span>
            {major.careers.join(', ')}
          </span>
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        <span className="text-[12.5px] text-muted-foreground">{t('majors.programCount', { count: major.programCount })}</span>
        <div className="flex gap-2">
          <Link to={`/student/guidance/careers?q=${encodeURIComponent(major.name)}`} className={buttonClass('secondary', 'sm')}>
            {t('majors.toCareers')}
          </Link>
          <Link to={`/student/guidance/preferences?q=${encodeURIComponent(major.name)}&type=${encodeURIComponent(major.scoreType)}`} className={buttonClass('soft', 'sm')} aria-label={`${t('majors.toPrograms')}: ${major.name}`}>
            {t('majors.toPrograms')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </li>
  );
}
