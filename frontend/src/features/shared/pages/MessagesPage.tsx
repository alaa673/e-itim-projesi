import clsx from 'clsx';
import { ArrowLeft, MessageSquarePlus, MessagesSquare, Search, Send } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { AsyncContent, EmptyState, Skeleton } from '@/components/ui/States';
import { Textarea } from '@/components/ui/Textarea';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import type { Conversation, UserRole } from '@/types';
import { formatDate, formatTime } from '@/utils/format';
import { contactsApi, messageApi } from '../services/commsApi';

const MAX_LENGTH = 1000;

export default function MessagesPage({ role }: { role: UserRole }) {
  const { t } = useTranslation(['shared', 'common']);
  const service = useMemo(() => messageApi(role), [role]);
  const { data, error, loading, reload } = useAsync((signal) => service.list({ offset: 0, limit: 100, sortKey: 'updatedAt', sortDirection: 'desc' }, signal), [service]);
  const [items, setItems] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [composing, setComposing] = useState(false);
  const { run } = useAction();

  useEffect(() => {
    if (data) setItems(data.items);
  }, [data]);

  const filtered = items.filter((c) => `${c.name} ${c.subtitle}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')));
  const active = items.find((c) => c.id === activeId) ?? null;
  const replace = (c: Conversation) => setItems((prev) => [c, ...prev.filter((x) => x.id !== c.id)]);

  const open = async (c: Conversation) => {
    setActiveId(c.id);
    if (c.unread > 0) {
      const updated = await service.markRead(c.id).catch(() => null);
      if (updated) setItems((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
    }
  };

  return (
    <>
      <PageHeader
        title={t(`nav.${role}.messages`, { ns: 'common' })}
        description={t(`messages.description.${role}`)}
        actions={
          <Button icon={<MessageSquarePlus className="h-4 w-4" aria-hidden />} onClick={() => setComposing(true)}>
            {t('messages.new')}
          </Button>
        }
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload} skeleton={<Skeleton className="h-[560px] rounded-panel" />}>
        {() => (
          <div className="panel grid h-[calc(100dvh-230px)] min-h-[480px] overflow-hidden md:grid-cols-[320px_minmax(0,1fr)]">
            <aside className={clsx('flex min-h-0 flex-col border-border md:border-r', active && 'hidden md:flex')} aria-label={t('messages.listLabel')}>
              <div className="border-b border-border p-3">
                <Input type="search" label={t('common.search', { ns: 'common' })} hideLabel placeholder={t('messages.search')} leading={<Search className="h-4 w-4" aria-hidden />} value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <ul className="scrollbar-thin flex-1 overflow-y-auto p-2">
                {filtered.length === 0 && <li className="px-3 py-6 text-center text-[14px] text-muted-foreground">{t('messages.noConversations')}</li>}
                {filtered.map((c) => {
                  const last = c.messages.at(-1);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => void open(c)}
                        aria-current={c.id === activeId ? 'true' : undefined}
                        className={clsx('flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors', c.id === activeId ? 'bg-accent-soft' : 'hover:bg-surface-muted')}
                      >
                        <Avatar name={c.name} size={40} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className={clsx('truncate text-[14.5px] text-foreground', c.unread ? 'font-bold' : 'font-semibold')}>{c.name}</span>
                            <span className="shrink-0 text-[11.5px] text-muted-foreground">
                              <RelativeTime iso={c.updatedAt} />
                            </span>
                          </span>
                          <span className="flex items-center justify-between gap-2">
                            <span className={clsx('truncate text-[13px]', c.unread ? 'text-foreground' : 'text-muted-foreground')}>
                              {last ? `${last.mine ? `${t('messages.you')}: ` : ''}${last.text}` : c.subtitle}
                            </span>
                            {c.unread > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground" aria-label={t('messages.unread', { count: c.unread })}>
                                {c.unread}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>
            <section className={clsx('min-h-0 flex-col', active ? 'flex' : 'hidden md:flex')} aria-label={active ? t('messages.threadWith', { name: active.name }) : undefined}>
              {active ? (
                <Thread
                  key={active.id}
                  conversation={active}
                  onBack={() => setActiveId(null)}
                  onSend={async (text) => {
                    const updated = await run(() => service.send(active.id, text));
                    if (updated) replace(updated);
                    return Boolean(updated);
                  }}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center p-6">
                  <EmptyState icon={<MessagesSquare className="h-5 w-5" aria-hidden />} title={t('messages.pick')} description={t('messages.pickHint')} />
                </div>
              )}
            </section>
          </div>
        )}
      </AsyncContent>
      <NewConversation
        role={role}
        open={composing}
        existing={items}
        onClose={() => setComposing(false)}
        onCreated={(c) => {
          setComposing(false);
          replace(c);
          setActiveId(c.id);
        }}
      />
    </>
  );
}

function Thread({ conversation, onBack, onSend }: { conversation: Conversation; onBack: () => void; onSend: (text: string) => Promise<boolean> }) {
  const { t } = useTranslation(['shared', 'common']);
  const locale = useLocale();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [conversation.messages.length]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    const ok = await onSend(value);
    setSending(false);
    if (ok) setText('');
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  let lastDay = '';
  return (
    <>
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button type="button" onClick={onBack} className="rounded-control p-2 text-muted-foreground hover:bg-foreground/[0.06] md:hidden" aria-label={t('actions.back', { ns: 'common' })}>
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <Avatar name={conversation.name} size={40} />
        <div>
          <h2 className="font-display text-[16px] font-extrabold text-foreground">{conversation.name}</h2>
          <p className="text-[12.5px] text-muted-foreground">{conversation.subtitle}</p>
        </div>
      </header>
      <ol className="scrollbar-thin flex-1 space-y-2 overflow-y-auto px-4 py-4" aria-live="polite">
        {conversation.messages.length === 0 && <li className="py-10 text-center text-[14px] text-muted-foreground">{t('messages.firstMessage')}</li>}
        {conversation.messages.map((m) => {
          const day = formatDate(m.at, locale, { day: 'numeric', month: 'long' });
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <li key={m.id}>
              {showDay && <p className="my-3 text-center text-[12px] font-semibold text-muted-foreground">{day}</p>}
              <div className={clsx('flex', m.mine ? 'justify-end' : 'justify-start')}>
                <div className={clsx('max-w-[78%] rounded-[18px] px-4 py-2.5 text-[14.5px]', m.mine ? 'rounded-br-[6px] bg-primary text-primary-foreground' : 'rounded-bl-[6px] bg-surface-muted text-foreground')}>
                  <span className="sr-only">{m.mine ? t('messages.you') : conversation.name}: </span>
                  <p className="whitespace-pre-line break-words">{m.text}</p>
                  <p className={clsx('mt-1 text-right text-[11px]', m.mine ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{formatTime(m.at, locale)}</p>
                </div>
              </div>
            </li>
          );
        })}
        <div ref={endRef} />
      </ol>
      <form onSubmit={submit} className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          containerClassName="flex-1"
          label={t('messages.compose')}
          hideLabel
          rows={1}
          className="max-h-32 min-h-[44px] resize-none"
          placeholder={t('messages.placeholder')}
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
        />
        <Button type="submit" variant="primary" size="icon" loading={sending} disabled={!text.trim()} aria-label={t('actions.send', { ns: 'common' })}>
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </form>
    </>
  );
}

function NewConversation({ role, open, existing, onClose, onCreated }: { role: UserRole; open: boolean; existing: Conversation[]; onClose: () => void; onCreated: (c: Conversation) => void }) {
  const { t } = useTranslation(['shared', 'common']);
  const contacts = useAsync((signal) => (open ? contactsApi(role, signal) : Promise.resolve([])), [open, role]);
  const service = useMemo(() => messageApi(role), [role]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const { run, busy } = useAction();
  const options = (contacts.data ?? []).map((c) => ({ value: c.name, label: `${c.name} · ${c.subtitle}` }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      preventClose={busy}
      title={t('messages.new')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            loading={busy}
            disabled={!name || !text.trim()}
            icon={<Send className="h-4 w-4" aria-hidden />}
            onClick={async () => {
              const contact = contacts.data?.find((c) => c.name === name);
              if (!contact) return;
              const result = await run(async () => {
                const conv = existing.find((c) => c.name === contact.name) ?? (await service.create({ name: contact.name, subtitle: contact.subtitle }));
                return service.send(conv.id, text.trim());
              });
              if (result) {
                setName('');
                setText('');
                onCreated(result);
              }
            }}
          >
            {t('actions.send', { ns: 'common' })}
          </Button>
        </>
      }
    >
      <Select label={t('messages.to')} value={name} onChange={(e) => setName(e.target.value)} placeholderOption={t('common.selectPlaceholder', { ns: 'common' })} options={options} />
      <Textarea containerClassName="mt-4" label={t('common.message', { ns: 'common' })} rows={4} maxLength={MAX_LENGTH} value={text} onChange={(e) => setText(e.target.value)} />
      <p className="mt-2 text-[12.5px] text-muted-foreground">{t('messages.policy')}</p>
    </Modal>
  );
}
