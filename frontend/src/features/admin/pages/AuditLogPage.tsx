import { Download, ScrollText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Column } from '@/components/ui/DataTable';
import { useListQuery } from '@/hooks/useListQuery';
import { useLocale } from '@/hooks/useLocale';
import { useResourceList } from '@/hooks/useResourceList';
import type { AuditEntry } from '@/types';
import { downloadCsv } from '@/utils/csv';
import { formatDate, formatTime } from '@/utils/format';
import { auditApi } from '../services/adminApi';

const ACTIONS = [
  'studentCreated', 'studentUpdated', 'accountDeactivated', 'teacherAssigned', 'pdfUploaded', 'questionsApproved',
  'announcementPublished', 'settingsChanged', 'examAssigned', 'gradesPublished', 'backupCompleted',
] as const;
const ROLE_TONE = { admin: 'accent', teacher: 'info', system: 'neutral' } as const;

export default function AuditLogPage() {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const lq = useListQuery<'actorRole' | 'action'>({ sort: { key: 'at', direction: 'desc' }, descFirst: ['at'] });
  const list = useResourceList(auditApi.list, lq.query);

  const columns: Column<AuditEntry>[] = [
    {
      id: 'at',
      header: t('audit.time'),
      sortKey: 'at',
      cell: (e) => (
        <time dateTime={e.at} className="block whitespace-nowrap tabular-nums">
          <span className="block text-foreground">{formatDate(e.at, locale, { day: 'numeric', month: 'short' })}</span>
          <span className="block text-[12.5px] text-muted-foreground">{formatTime(e.at, locale)}</span>
        </time>
      ),
    },
    {
      id: 'actor',
      header: t('audit.actor'),
      cell: (e) => (
        <span className="flex items-center gap-2">
          <Avatar name={e.actor} size={28} />
          <span>
            <span className="block">{e.actor}</span>
            <Badge tone={ROLE_TONE[e.actorRole]} className="mt-0.5">
              {t(`audit.roles.${e.actorRole}`)}
            </Badge>
          </span>
        </span>
      ),
    },
    { id: 'action', header: t('audit.action'), rowHeader: true, cell: (e) => <span className="font-semibold text-foreground">{t(`audit.actions.${e.action}`)}</span> },
    { id: 'target', header: t('audit.target'), cell: (e) => <span className="text-foreground">{e.target}</span> },
    { id: 'ip', header: t('audit.ip'), hideOnMobile: true, cell: (e) => <span className="font-mono text-[12.5px] text-muted-foreground">{e.ip}</span> },
  ];

  return (
    <>
      <PageHeader
        title={t('audit.title')}
        description={t('audit.description')}
        actions={
          <Button
            variant="secondary"
            icon={<Download className="h-4 w-4" aria-hidden />}
            disabled={list.items.length === 0}
            onClick={() =>
              downloadCsv('pusula-islem-kayitlari', [
                [t('audit.time'), t('audit.actor'), t('audit.action'), t('audit.target'), t('audit.ip')],
                ...list.items.map((e) => [`${formatDate(e.at, locale)} ${formatTime(e.at, locale)}`, e.actor, t(`audit.actions.${e.action}`), e.target, e.ip]),
              ])
            }
          >
            {t('approved.exportLoaded', { count: list.items.length })}
          </Button>
        }
      />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('audit.searchPlaceholder')}
        filters={[
          { key: 'actorRole', label: t('audit.actor'), value: lq.filters.actorRole ?? '', allLabel: t('common.all', { ns: 'common' }), options: (['admin', 'teacher', 'system'] as const).map((v) => ({ value: v, label: t(`audit.roles.${v}`) })) },
          { key: 'action', label: t('audit.action'), value: lq.filters.action ?? '', allLabel: t('common.all', { ns: 'common' }), options: ACTIONS.map((v) => ({ value: v, label: t(`audit.actions.${v}`) })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'actorRole' | 'action', v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('audit.title')}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        empty={{ icon: <ScrollText className="h-5 w-5" aria-hidden />, title: t('audit.empty') }}
      />
      <p className="mt-3 text-[13px] text-muted-foreground">{t('audit.note')}</p>
    </>
  );
}
