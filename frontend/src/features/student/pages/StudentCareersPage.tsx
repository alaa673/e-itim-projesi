import clsx from 'clsx';
import { BriefcaseBusiness, GraduationCap, Sparkles, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { ListFooter } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { DemoDataNote } from '@/components/ui/DemoDataNote';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { CAREER_FIELDS } from '@/config/catalog';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { useResourceList } from '@/hooks/useResourceList';
import type { Career } from '@/types';
import { careerSearchApi, majorSuggestions } from '../services/studentApi';

const OUTLOOK_TONE = { high: 'success', medium: 'info', low: 'neutral' } as const;

export default function StudentCareersPage() {
  const { t } = useTranslation(['student', 'common']);
  const [params] = useSearchParams();
  const lq = useListQuery<'field' | 'outlook'>({ sort: { key: 'name', direction: 'asc' }, search: params.get('q') ?? '' });
  const list = useResourceList(careerSearchApi.list, lq.query);
  const suggestions = useAsync((signal) => majorSuggestions(signal), []);
  const suggested = useMemo(() => new Set((suggestions.data ?? []).slice(0, 4).flatMap((m) => m.careers)), [suggestions.data]);

  return (
    <>
      <PageHeader title={t('nav.student.careers', { ns: 'common' })} description={t('careers.description')} />
      <DemoDataNote />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('careers.searchPlaceholder')}
        filters={[
          { key: 'field', label: t('careers.field'), value: lq.filters.field ?? '', allLabel: t('careers.allFields'), options: CAREER_FIELDS.map((f) => ({ value: f, label: f })) },
          { key: 'outlook', label: t('careers.outlook'), value: lq.filters.outlook ?? '', allLabel: t('careers.allOutlooks'), options: (['high', 'medium', 'low'] as const).map((o) => ({ value: o, label: t(`careers.outlookLevel.${o}`) })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'field' | 'outlook', v)}
        onClear={lq.clear}
      />

      {list.status === 'error' ? (
        <div className="panel">
          <ErrorState error={list.error} onRetry={list.retry} />
        </div>
      ) : list.status === 'loading' && list.items.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-56 rounded-panel" />
          ))}
        </div>
      ) : list.items.length === 0 ? (
        <div className="panel">
          <EmptyState icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden />} title={lq.active ? t('states.noResults', { ns: 'common' }) : t('careers.empty')} />
        </div>
      ) : (
        <>
          <p className="sr-only" aria-live="polite">
            {t('careers.count', { count: list.total })}
          </p>
          <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {list.items.map((c) => (
              <CareerCard key={c.id} career={c} suggested={suggested.has(c.name)} />
            ))}
          </ul>
          <div className="panel mt-4">
            <ListFooter list={list} />
          </div>
        </>
      )}
    </>
  );
}

function CareerCard({ career, suggested }: { career: Career; suggested: boolean }) {
  const { t } = useTranslation(['student', 'common']);
  return (
    <li className={clsx('panel flex flex-col p-5', suggested && 'ring-2 ring-primary/25')}>
      <article aria-labelledby={`car-${career.id}`} className="flex flex-1 flex-col">
        <div className="flex items-start gap-3">
          <span className="icon-tile h-12 w-12 shrink-0 bg-tint-sky text-ink-sky">
            <BriefcaseBusiness className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={`car-${career.id}`} className="font-display text-[17px] font-extrabold leading-snug text-foreground">
              {career.name}
            </h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
              {career.field}
              <Badge tone="neutral">{career.scoreType}</Badge>
            </p>
          </div>
          {suggested && (
            <Badge tone="accent" icon={<Sparkles className="h-3 w-3" aria-hidden />}>
              {t('careers.forYou')}
            </Badge>
          )}
        </div>
        <p className="mt-3 text-[14.5px] leading-relaxed text-foreground">{career.description}</p>
        <p className="mt-3 flex items-center gap-2 text-[13px]">
          <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">{t('careers.outlook')}:</span>
          <Badge tone={OUTLOOK_TONE[career.outlook]} dot>
            {t(`careers.outlookLevel.${career.outlook}`)}
          </Badge>
        </p>
        <div className="mt-3">
          <h3 className="text-[12.5px] font-bold uppercase tracking-wide text-muted-foreground">{t('careers.skills')}</h3>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {career.skills.map((s) => (
              <li key={s} className="rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-[12.5px] font-semibold text-foreground">
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto pt-4">
          <h3 className="text-[12.5px] font-bold uppercase tracking-wide text-muted-foreground">{t('careers.programs')}</h3>
          <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {career.programs.map((p) => (
              <li key={p}>
                <Link to={`/student/guidance/preferences?q=${encodeURIComponent(p)}&type=${encodeURIComponent(career.scoreType)}`} className="link-accent inline-flex items-center gap-1 text-[13.5px]">
                  <GraduationCap className="h-4 w-4" aria-hidden />
                  {p}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </li>
  );
}
