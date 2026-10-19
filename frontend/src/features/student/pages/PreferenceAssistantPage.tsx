import { BookmarkCheck, BookmarkPlus, Compass, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Column } from '@/components/ui/DataTable';
import { DemoDataNote } from '@/components/ui/DemoDataNote';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useListQuery } from '@/hooks/useListQuery';
import { useLocale } from '@/hooks/useLocale';
import { useResourceList } from '@/hooks/useResourceList';
import type { HighSchool, ScoreType, UniversityProgram } from '@/types';
import { formatNumber } from '@/utils/format';
import { mockHistoryApi, programSearchApi, savedApi, schoolSearchApi } from '../services/studentApi';
import { CITIES, SCHOOL_TYPES, SCORE_TYPES } from '@/config/catalog';

type Chance = 'safe' | 'match' | 'reach';
const CHANCE_TONE = { safe: 'success', match: 'info', reach: 'warning' } as const;

function schoolChance(score: number, base: number): Chance {
  if (score >= base + 10) return 'safe';
  if (score >= base - 10) return 'match';
  return 'reach';
}
function programChance(rank: number, base: number): Chance {
  if (rank <= base * 0.8) return 'safe';
  if (rank <= base * 1.15) return 'match';
  return 'reach';
}

export default function PreferenceAssistantPage() {
  const { user } = useAuth();
  return user?.level === 'high' ? <ProgramAssistant /> : <SchoolAssistant />;
}

function useSaved() {
  const saved = useAsync((signal) => savedApi.list({ offset: 0, limit: 100, sortKey: 'order' }, signal), []);
  const { run, busy } = useAction();
  const add = async (input: Parameters<typeof savedApi.create>[0], success: string) => {
    const ok = await run(() => savedApi.create({ ...input, order: (saved.data?.total ?? 0) + 1 }), { success });
    if (ok) saved.reload();
  };
  const refs = new Set((saved.data?.items ?? []).map((s) => s.refId));
  return { refs, add, busy, count: saved.data?.total ?? 0 };
}

function ChanceLegend() {
  const { t } = useTranslation('student');
  return (
    <p className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
      <Info className="h-4 w-4" aria-hidden />
      {(['safe', 'match', 'reach'] as const).map((c) => (
        <Badge key={c} tone={CHANCE_TONE[c]} dot>
          {t(`preferences.chance.${c}`)}
        </Badge>
      ))}
      <span>{t('preferences.chanceNote')}</span>
    </p>
  );
}

function SchoolAssistant() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const history = useAsync((signal) => mockHistoryApi.list({ offset: 0, limit: 1, sortKey: 'date', sortDirection: 'desc' }, signal), []);
  const [scoreText, setScoreText] = useState('');
  const fallback = history.data?.items[0]?.score;
  const score = Number(useDebounce(scoreText, 300) || fallback || 0);
  const lq = useListQuery<'city' | 'type'>({ sort: { key: 'score', direction: 'desc' } });
  const list = useResourceList(schoolSearchApi.list, lq.query);
  const saved = useSaved();
  const invalid = scoreText !== '' && (Number(scoreText) < 100 || Number(scoreText) > 500);

  const columns: Column<HighSchool>[] = useMemo(
    () => [
      {
        id: 'name',
        header: t('preferences.school'),
        rowHeader: true,
        cell: (s) => (
          <span className="block min-w-[220px]">
            <span className="block font-semibold text-foreground">{s.name}</span>
            <span className="block text-[12.5px] font-normal text-muted-foreground">
              {s.city} / {s.district} · {s.type}
            </span>
          </span>
        ),
      },
      { id: 'quota', header: t('common.quota', { ns: 'common' }), align: 'right', hideOnMobile: true, cell: (s) => <span className="tabular-nums">{s.quota}</span> },
      { id: 'score', header: t('preferences.baseScore'), sortKey: 'score', align: 'right', cell: (s) => <span className="font-semibold tabular-nums">{formatNumber(s.scores.at(-1)?.baseScore ?? 0, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> },
      {
        id: 'chance',
        header: t('preferences.chanceLabel'),
        cell: (s) => {
          const c = schoolChance(score, s.scores.at(-1)?.baseScore ?? 0);
          return score ? <Badge tone={CHANCE_TONE[c]} dot>{t(`preferences.chance.${c}`)}</Badge> : '—';
        },
      },
      {
        id: 'actions',
        header: t('table.actions', { ns: 'common' }),
        align: 'right',
        cell: (s) =>
          saved.refs.has(s.id) ? (
            <Badge tone="accent" icon={<BookmarkCheck className="h-3.5 w-3.5" aria-hidden />}>
              {t('preferences.inList')}
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="soft"
              disabled={saved.busy || saved.count >= 20}
              icon={<BookmarkPlus className="h-4 w-4" aria-hidden />}
              aria-label={`${t('actions.saveToList', { ns: 'common' })}: ${s.name}`}
              onClick={() => void saved.add({ kind: 'school', refId: s.id, name: s.name, detail: `${s.city} · ${s.type}`, score: s.scores.at(-1)?.baseScore ?? null, rank: null, order: 0, note: '' }, t('preferences.added', { name: s.name }))}
            >
              {t('actions.saveToList', { ns: 'common' })}
            </Button>
          ),
      },
    ],
    [t, locale, score, saved],
  );

  return (
    <>
      <PageHeader title={t('nav.student.preferenceAssistant', { ns: 'common' })} description={t('preferences.descriptionLgs')} />
      <DemoDataNote />
      <div className="panel mb-4 flex flex-wrap items-end gap-4 p-4">
        <Input
          containerClassName="w-[220px]"
          label={t('preferences.yourScore')}
          type="number"
          min={100}
          max={500}
          step={0.01}
          placeholder={fallback ? String(fallback) : '400'}
          value={scoreText}
          onChange={(e) => setScoreText(e.target.value)}
          error={invalid ? t('preferences.scoreRange') : undefined}
          hint={!scoreText && fallback ? t('preferences.fromMock', { score: fallback }) : undefined}
        />
        <p className="max-w-xl pb-2 text-[13px] text-muted-foreground">{t('preferences.howLgs')}</p>
      </div>
      <ChanceLegend />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('preferences.searchSchools')}
        filters={[
          { key: 'city', label: t('common.city', { ns: 'common' }), value: lq.filters.city ?? '', allLabel: t('preferences.allCities'), options: CITIES.map((c) => ({ value: c, label: c })) },
          { key: 'type', label: t('common.type', { ns: 'common' }), value: lq.filters.type ?? '', allLabel: t('common.allTypes', { ns: 'common' }), options: SCHOOL_TYPES.map((c) => ({ value: c, label: c })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'city' | 'type', v)}
        onClear={lq.clear}
      />
      <ResourceTable caption={t('preferences.school')} columns={columns} list={list} sort={lq.sort} onSortChange={lq.onSortChange} filtersActive={lq.active} onClearFilters={lq.clear} empty={{ icon: <Compass className="h-5 w-5" aria-hidden />, title: t('preferences.empty') }} />
    </>
  );
}

function ProgramAssistant() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const [params] = useSearchParams();
  const [scoreType, setScoreType] = useState<ScoreType>(() => (SCORE_TYPES as string[]).includes(params.get('type') ?? '') ? (params.get('type') as ScoreType) : 'SAY');
  const [rankText, setRankText] = useState('42000');
  const rank = Number(useDebounce(rankText, 300)) || 0;
  const lq = useListQuery<'city' | 'kind' | 'scoreType'>({ sort: { key: 'baseRank', direction: 'asc' }, search: params.get('q') ?? '' });
  const query = useMemo(() => ({ ...lq.query, filters: { ...lq.query.filters, scoreType } }), [lq.query, scoreType]);
  const list = useResourceList(programSearchApi.list, query);
  const saved = useSaved();

  const columns: Column<UniversityProgram>[] = useMemo(
    () => [
      {
        id: 'program',
        header: t('preferences.program'),
        rowHeader: true,
        cell: (p) => (
          <span className="block min-w-[240px]">
            <span className="block font-semibold text-foreground">{p.program}</span>
            <span className="block text-[12.5px] font-normal text-muted-foreground">
              {p.university} · {p.city} · {p.kind}
            </span>
          </span>
        ),
      },
      { id: 'quota', header: t('common.quota', { ns: 'common' }), align: 'right', hideOnMobile: true, cell: (p) => <span className="tabular-nums">{p.quota}</span> },
      { id: 'baseRank', header: t('preferences.baseRank'), sortKey: 'baseRank', align: 'right', cell: (p) => <span className="font-semibold tabular-nums">{formatNumber(p.baseRank, locale)}</span> },
      {
        id: 'chance',
        header: t('preferences.chanceLabel'),
        cell: (p) => {
          const c = programChance(rank, p.baseRank);
          return rank ? <Badge tone={CHANCE_TONE[c]} dot>{t(`preferences.chance.${c}`)}</Badge> : '—';
        },
      },
      {
        id: 'actions',
        header: t('table.actions', { ns: 'common' }),
        align: 'right',
        cell: (p) =>
          saved.refs.has(p.id) ? (
            <Badge tone="accent" icon={<BookmarkCheck className="h-3.5 w-3.5" aria-hidden />}>
              {t('preferences.inList')}
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="soft"
              disabled={saved.busy || saved.count >= 24}
              icon={<BookmarkPlus className="h-4 w-4" aria-hidden />}
              aria-label={`${t('actions.saveToList', { ns: 'common' })}: ${p.university} ${p.program}`}
              onClick={() => void saved.add({ kind: 'program', refId: p.id, name: `${p.university} — ${p.program}`, detail: `${p.city} · ${p.kind} · ${p.scoreType}`, score: null, rank: p.baseRank, order: 0, note: '' }, t('preferences.added', { name: p.program }))}
            >
              {t('actions.saveToList', { ns: 'common' })}
            </Button>
          ),
      },
    ],
    [t, locale, rank, saved],
  );

  return (
    <>
      <PageHeader title={t('nav.student.preferenceAssistant', { ns: 'common' })} description={t('preferences.descriptionYks')} />
      <DemoDataNote />
      <div className="panel mb-4 flex flex-wrap items-end gap-4 p-4">
        <SegmentedControl label={t('preferences.scoreType')} value={scoreType} onChange={setScoreType} options={SCORE_TYPES.map((v) => ({ value: v, label: v }))} />
        <Input containerClassName="w-[220px]" label={t('preferences.yourRank')} type="number" min={1} value={rankText} onChange={(e) => setRankText(e.target.value)} hint={t('preferences.rankHint')} />
        <p className="max-w-md pb-2 text-[13px] text-muted-foreground">{t('preferences.howYks')}</p>
      </div>
      <ChanceLegend />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('preferences.searchPrograms')}
        filters={[
          { key: 'city', label: t('common.city', { ns: 'common' }), value: lq.filters.city ?? '', allLabel: t('preferences.allCities'), options: CITIES.map((c) => ({ value: c, label: c })) },
          { key: 'kind', label: t('common.type', { ns: 'common' }), value: lq.filters.kind ?? '', allLabel: t('common.allTypes', { ns: 'common' }), options: [{ value: 'Devlet', label: t('preferences.state') }, { value: 'Vakıf', label: t('preferences.foundation') }] },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'city' | 'kind', v)}
        onClear={lq.clear}
      />
      <ResourceTable caption={t('preferences.program')} columns={columns} list={list} sort={lq.sort} onSortChange={lq.onSortChange} filtersActive={lq.active} onClearFilters={lq.clear} empty={{ icon: <Compass className="h-5 w-5" aria-hidden />, title: t('preferences.empty') }} />
    </>
  );
}
