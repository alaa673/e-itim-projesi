import clsx from 'clsx';
import { LifeBuoy, MessageSquareReply, Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/providers/authContext';
import { ResourceTable } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { useAction } from '@/hooks/useAction';
import { useListQuery } from '@/hooks/useListQuery';
import { useLocale } from '@/hooks/useLocale';
import { useResourceList } from '@/hooks/useResourceList';
import type { SupportRequest } from '@/types';
import { formatDate, formatTime } from '@/utils/format';
import { supportRequestApi } from '../services/adminApi';
import { PRIORITY_TONE, REQUEST_STATUS_TONE } from '@/config/catalog';

type F = 'status' | 'priority' | 'category';

export default function SupportRequestsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const lq = useListQuery<F>({ sort: { key: 'createdAt', direction: 'desc' }, descFirst: ['createdAt', 'priority'] });
  const list = useResourceList(supportRequestApi.list, lq.query);
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = list.items.find((r) => r.id === openId) ?? null;

  const columns: Column<SupportRequest>[] = [
    {
      id: 'subject',
      header: t('support.subject'),
      rowHeader: true,
      cell: (r) => (
        <button type="button" onClick={() => setOpenId(r.id)} className="block min-w-[220px] text-left">
          <span className="block font-semibold text-foreground hover:text-accent-ink hover:underline">{r.subject}</span>
          <span className="block text-[12.5px] font-normal text-muted-foreground">{t('support.messages', { count: r.messages.length })}</span>
        </button>
      ),
    },
    {
      id: 'requester',
      header: t('support.requester'),
      cell: (r) => (
        <span className="flex items-center gap-2">
          <Avatar name={r.requester} size={28} />
          <span>
            <span className="block">{r.requester}</span>
            <span className="block text-[12px] text-muted-foreground">{t(`roles.${r.requesterRole}`, { ns: 'common' })}</span>
          </span>
        </span>
      ),
    },
    { id: 'category', header: t('common.category', { ns: 'common' }), hideOnMobile: true, cell: (r) => t(`support.categories.${r.category}`) },
    { id: 'priority', header: t('common.priority', { ns: 'common' }), sortKey: 'priority', cell: (r) => <Badge tone={PRIORITY_TONE[r.priority]}>{t(`support.priorities.${r.priority}`)}</Badge> },
    { id: 'status', header: t('common.status', { ns: 'common' }), cell: (r) => <Badge tone={REQUEST_STATUS_TONE[r.status]} dot>{t(`support.statuses.${r.status}`)}</Badge> },
    { id: 'createdAt', header: t('common.createdAt', { ns: 'common' }), sortKey: 'createdAt', hideOnMobile: true, cell: (r) => <span className="text-muted-foreground"><RelativeTime iso={r.createdAt} /></span> },
    {
      id: 'actions',
      header: t('table.actions', { ns: 'common' }),
      align: 'right',
      cell: (r) => (
        <Button size="sm" variant="soft" icon={<MessageSquareReply className="h-4 w-4" aria-hidden />} onClick={() => setOpenId(r.id)} aria-label={`${t('actions.reply', { ns: 'common' })}: ${r.subject}`}>
          {t('actions.reply', { ns: 'common' })}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t('support.title')} description={t('support.description')} />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('support.searchPlaceholder')}
        filters={[
          { key: 'status', label: t('common.status', { ns: 'common' }), value: lq.filters.status ?? '', allLabel: t('common.allStatuses', { ns: 'common' }), options: (['open', 'inProgress', 'resolved'] as const).map((v) => ({ value: v, label: t(`support.statuses.${v}`) })) },
          { key: 'priority', label: t('common.priority', { ns: 'common' }), value: lq.filters.priority ?? '', allLabel: t('common.all', { ns: 'common' }), options: (['urgent', 'normal', 'low'] as const).map((v) => ({ value: v, label: t(`support.priorities.${v}`) })) },
          { key: 'category', label: t('common.category', { ns: 'common' }), value: lq.filters.category ?? '', allLabel: t('common.all', { ns: 'common' }), options: (['account', 'file', 'exam', 'content', 'other'] as const).map((v) => ({ value: v, label: t(`support.categories.${v}`) })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as F, v)}
        onClear={lq.clear}
      />
      <ResourceTable
        caption={t('support.title')}
        columns={columns}
        list={list}
        sort={lq.sort}
        onSortChange={lq.onSortChange}
        filtersActive={lq.active}
        onClearFilters={lq.clear}
        selectedRowId={openId}
        empty={{ icon: <LifeBuoy className="h-5 w-5" aria-hidden />, title: t('support.empty') }}
      />
      <RequestDrawer request={selected} onClose={() => setOpenId(null)} onChanged={list.updateItem} />
    </>
  );
}

function RequestDrawer({ request, onClose, onChanged }: { request: SupportRequest | null; onClose: () => void; onChanged: (r: SupportRequest) => void }) {
  const { t } = useTranslation(['admin', 'common']);
  const locale = useLocale();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const { run, busy } = useAction();
  const me = user ? `${user.firstName} ${user.lastName}` : '';

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!request || !text.trim()) return;
    const saved = await run(() => supportRequestApi.reply(request.id, text.trim(), me), { success: t('support.replied') });
    if (saved) {
      onChanged(saved);
      setText('');
    }
  };
  const setStatus = async (status: SupportRequest['status']) => {
    if (!request) return;
    const saved = await run(() => supportRequestApi.update(request.id, { status }), { success: t('support.statusChanged', { status: t(`support.statuses.${status}`) }) });
    if (saved) onChanged(saved);
  };

  return (
    <Modal open={request !== null} onClose={onClose} variant="side" size="lg" title={request?.subject ?? ''} description={request ? `${request.requester} · ${t(`support.categories.${request.category}`)}` : undefined}>
      {request && (
        <div className="flex h-full flex-col">
          <SegmentedControl
            label={t('common.status', { ns: 'common' })}
            value={request.status}
            onChange={(v) => void setStatus(v)}
            options={(['open', 'inProgress', 'resolved'] as const).map((v) => ({ value: v, label: t(`support.statuses.${v}`) }))}
          />
          <ol className="mt-5 flex-1 space-y-3" aria-label={t('support.thread')}>
            {request.messages.map((m) => {
              const mine = m.fromRole === 'admin';
              return (
                <li key={m.id} className={clsx('flex gap-2.5', mine && 'flex-row-reverse')}>
                  <Avatar name={m.from} size={32} />
                  <div className={clsx('max-w-[80%] rounded-[16px] px-4 py-2.5', mine ? 'rounded-tr-[6px] bg-primary text-primary-foreground' : 'rounded-tl-[6px] bg-surface-muted text-foreground')}>
                    <p className={clsx('text-[12px] font-semibold', mine ? 'text-primary-foreground/85' : 'text-muted-foreground')}>
                      {m.from} · {formatDate(m.at, locale, { day: 'numeric', month: 'short' })} {formatTime(m.at, locale)}
                    </p>
                    <p className="mt-0.5 whitespace-pre-line text-[14.5px]">{m.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <form onSubmit={send} className="mt-5 border-t border-border pt-4">
            <Textarea label={t('support.replyLabel')} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('support.replyPlaceholder')} maxLength={2000} />
            <div className="mt-3 flex justify-end">
              <Button type="submit" loading={busy} disabled={!text.trim()} icon={<Send className="h-4 w-4" aria-hidden />}>
                {t('actions.send', { ns: 'common' })}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
