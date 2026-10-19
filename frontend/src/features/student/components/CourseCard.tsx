import clsx from 'clsx';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import mathArt from '@/assets/illustrations/card-math.webp';
import scienceArt from '@/assets/illustrations/card-science.webp';
import { Meter } from '@/components/charts/Meter';
import { buttonClass } from '@/components/ui/buttonStyles';
import { useLocale } from '@/hooks/useLocale';
import { formatPercent } from '@/utils/format';
import { subjectIcon } from '../subjectIcon';
import type { StudentSubject } from '../types';

const ART = { math: mathArt, science: scienceArt } as const;

const THEME = {
  violet: { card: 'course-card--violet', muted: 'text-white/85', track: 'bg-white/20', fill: 'bg-lime', cta: 'inverse' as const, link: 'text-white' },
  peach: { card: 'course-card--peach', muted: 'text-[#26104f]/80', track: 'bg-[#26104f]/12', fill: 'bg-[#f2763a]', cta: 'ink' as const, link: 'text-[#26104f]', fixedCta: true },
  mint: { card: 'course-card--mint', muted: 'text-muted-foreground', track: 'bg-foreground/[0.08]', fill: 'bg-success', cta: 'ink' as const, link: 'text-foreground' },
  sky: { card: 'course-card--sky', muted: 'text-muted-foreground', track: 'bg-foreground/[0.08]', fill: 'bg-info', cta: 'ink' as const, link: 'text-foreground' },
};

/**
 * Illustrated subject card (Senin öğrenme rotan / Derslerim).
 * `ctaLabel` lets the dashboard vary the main action ("Derse dön" / "Keşfet").
 */
export function CourseCard({ subject, ctaLabel, headingLevel = 3 }: { subject: StudentSubject; ctaLabel?: string; headingLevel?: 2 | 3 }) {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const theme = THEME[subject.tone];
  const Icon = subjectIcon(subject.name);
  const percent = subject.topicsTotal ? (subject.topicsDone / subject.topicsTotal) * 100 : 0;
  const art = subject.illustration ? ART[subject.illustration] : null;
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <article className={clsx('course-card min-h-[300px] motion-safe:animate-rise-in', theme.card)}>
      {art ? (
        <img
          src={art}
          alt=""
          aria-hidden
          decoding="async"
          className="pointer-events-none absolute -right-2 top-0 h-[64%] w-auto select-none object-contain [mask-image:radial-gradient(75%_75%_at_62%_45%,black_58%,transparent_100%)]"
        />
      ) : (
        <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 flex h-36 w-36 items-center justify-center rounded-full bg-surface/60">
          <Icon className="h-14 w-14 opacity-70" strokeWidth={1.6} />
        </span>
      )}

      <p className="relative flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.08em]">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
        {subject.name.toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-US')}
      </p>
      <Heading className="relative mt-2 max-w-[66%] font-display text-[22px] font-extrabold leading-[1.12] tracking-[-0.02em]">{subject.headline}</Heading>
      <p className={clsx('relative mt-2 max-w-[62%] text-[14px] leading-snug', theme.muted)}>{subject.blurb}</p>

      <div className="relative mt-auto pt-5">
        <div className="mb-2 flex items-center justify-between text-[14px] font-semibold">
          <span>{t('dashboard.course.topics', { done: subject.topicsDone, total: subject.topicsTotal })}</span>
          <span className="tabular-nums">{formatPercent(percent, locale, 1)}</span>
        </div>
        <Meter value={percent} label={t('dashboard.course.progressLabel', { subject: subject.name })} track={theme.track} fill={theme.fill} size="lg" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link to={`/student/lessons?open=${subject.id}`} className={buttonClass(theme.cta, 'md', 'fixedCta' in theme ? '!bg-[#26104f] !text-white hover:!bg-[#26104f]/90' : undefined)}>
            {ctaLabel ?? t('dashboard.course.back')}
            <ArrowRight className="h-4 w-4" aria-hidden />
            <span className="sr-only">: {subject.name}</span>
          </Link>
          <Link to={`/student/progress?subject=${encodeURIComponent(subject.name)}`} className={clsx('inline-flex items-center gap-1.5 text-[14px] font-semibold underline-offset-4 hover:underline', theme.link)}>
            <BarChart3 className="h-4 w-4" aria-hidden />
            {t('dashboard.course.details')}
            <span className="sr-only">: {subject.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
