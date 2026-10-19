import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CircleHelp, Inbox, LifeBuoy, MessageSquareText, Search, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/app/providers/authContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { Textarea } from '@/components/ui/Textarea';
import { PRIORITY_TONE, REQUEST_STATUS_TONE } from '@/config/catalog';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import type { SupportRequest, UserRole } from '@/types';
import { helpRequestApi } from '../services/accountApi';

const FAQ: Record<UserRole, string[]> = {
  student: ['login', 'password', 'exams', 'appeal', 'mocks', 'guidance', 'privacy'],
  teacher: ['classes', 'content', 'ai', 'grading', 'support', 'export', 'privacy'],
  admin: ['import', 'terms', 'archive', 'aiKey', 'backup', 'permissions', 'privacy'],
};
const CATEGORIES = ['account', 'file', 'exam', 'content', 'other'] as const;
const PRIORITIES = ['low', 'normal', 'urgent'] as const;

const schema = z.object({
  subject: z.string().trim().min(5, 'validation.tooShort').max(100, 'validation.tooLong'),
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  message: z.string().trim().min(10, 'validation.tooShort').max(1000, 'validation.tooLong'),
});
type FormValues = z.infer<typeof schema>;

export default function HelpPage() {
  const { t } = useTranslation(['account', 'common']);
  const { user } = useAuth();
  const role = user?.role ?? 'student';

  return (
    <>
      <PageHeader title={t('nav.account.help', { ns: 'common' })} description={t(`help.description.${role}`)} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <FaqPanel role={role} />
        <div className="space-y-6">
          {role === 'admin' ? (
            <Panel icon={Inbox} title={t('help.adminInboxTitle')} description={t('help.adminInboxHint')}>
              <Link to="/admin/support-requests" className={buttonClass('ink')}>
                {t('nav.admin.supportRequests', { ns: 'common' })}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Panel>
          ) : (
            <RequestArea />
          )}
        </div>
      </div>
    </>
  );
}

function FaqPanel({ role }: { role: UserRole }) {
  const { t } = useTranslation(['account', 'common']);
  const [query, setQuery] = useState('');
  const items = useMemo(() => {
    const all = FAQ[role].map((id) => ({ id, q: t(`help.faq.${role}.${id}.q`), a: t(`help.faq.${role}.${id}.a`) }));
    const term = query.trim().toLocaleLowerCase();
    return term ? all.filter((x) => `${x.q} ${x.a}`.toLocaleLowerCase().includes(term)) : all;
  }, [role, query, t]);

  return (
    <Panel icon={CircleHelp} title={t('help.faqTitle')} description={t('help.faqHint')}>
      <Input type="search" label={t('help.searchLabel')} hideLabel placeholder={t('help.searchPlaceholder')} leading={<Search className="h-4 w-4" aria-hidden />} value={query} onChange={(e) => setQuery(e.target.value)} />
      <p className="sr-only" aria-live="polite">
        {t('help.results', { count: items.length })}
      </p>
      {items.length === 0 ? (
        <EmptyState className="py-8" title={t('help.noMatch')} description={t('help.noMatchHint')} />
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((x) => (
            <li key={x.id}>
              <Disclosure summary={<span className="text-[15px] font-semibold text-foreground">{x.q}</span>}>
                <p className="px-4 pb-4 text-[14.5px] leading-relaxed text-foreground/85">{x.a}</p>
              </Disclosure>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RequestArea() {
  const { t } = useTranslation(['account', 'common']);
  const mine = useAsync((signal) => helpRequestApi.mine(signal), []);
  const { run } = useAction();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { subject: '', category: 'account', priority: 'normal', message: '' } });
  const msg = (key?: string) => (key ? t(key, { ns: 'common' }) : undefined);
  const length = watch('message').length;

  return (
    <>
      <Panel icon={LifeBuoy} title={t('help.formTitle')} description={t('help.formHint')}>
        <form
          noValidate
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            const created = await run(() => helpRequestApi.create(values), { success: t('help.sent') });
            if (created) {
              reset();
              mine.reload();
            }
          })}
        >
          <Input label={t('help.subject')} placeholder={t('help.subjectPlaceholder')} maxLength={100} error={msg(errors.subject?.message)} {...register('subject')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label={t('help.category')} options={CATEGORIES.map((c) => ({ value: c, label: t(`support.categories.${c}`, { ns: 'admin' }) }))} {...register('category')} />
            <Select label={t('common.priority', { ns: 'common' })} options={PRIORITIES.map((p) => ({ value: p, label: t(`support.priorities.${p}`, { ns: 'admin' }) }))} {...register('priority')} />
          </div>
          <Textarea label={t('help.message')} rows={5} maxLength={1000} placeholder={t('help.messagePlaceholder')} error={msg(errors.message?.message)} hint={t('help.messageHint', { count: 1000 - length })} {...register('message')} />
          <div className="flex justify-end">
            <Button type="submit" variant="ink" loading={isSubmitting} icon={<Send className="h-4 w-4" aria-hidden />}>
              {t('actions.send', { ns: 'common' })}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel icon={MessageSquareText} title={t('help.myRequests')}>
        <AsyncContent data={mine.data} error={mine.error} loading={mine.loading} reload={mine.reload}>
          {(items) =>
            items.length === 0 ? (
              <EmptyState className="py-8" icon={<Inbox className="h-5 w-5" aria-hidden />} title={t('help.noRequests')} />
            ) : (
              <ul className="space-y-2.5">
                {items.map((r) => (
                  <RequestItem key={r.id} request={r} />
                ))}
              </ul>
            )
          }
        </AsyncContent>
      </Panel>
    </>
  );
}

function RequestItem({ request: r }: { request: SupportRequest }) {
  const { t } = useTranslation(['account', 'common']);
  const replies = r.messages.filter((m) => m.fromRole === 'admin').length;
  return (
    <li>
      <Disclosure
        buttonClassName="items-start py-3"
        summary={
          <span className="flex items-start gap-3">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">{r.subject}</span>
              <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
                {t(`support.categories.${r.category}`, { ns: 'admin' })} · <RelativeTime iso={r.createdAt} /> · {t('help.replies', { count: replies })}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <Badge tone={REQUEST_STATUS_TONE[r.status]} dot>
                {t(`support.statuses.${r.status}`, { ns: 'admin' })}
              </Badge>
              <Badge tone={PRIORITY_TONE[r.priority]}>{t(`support.priorities.${r.priority}`, { ns: 'admin' })}</Badge>
            </span>
          </span>
        }
      >
        <ol className="space-y-2 px-4 pb-4">
          {r.messages.map((m) => (
            <li key={m.id} className={m.fromRole === 'admin' ? 'ml-6 rounded-[12px] bg-surface px-3 py-2' : 'mr-6 rounded-[12px] bg-surface-muted px-3 py-2'}>
              <p className="text-[12.5px] font-semibold text-muted-foreground">
                {m.fromRole === 'admin' ? t('help.schoolAdmin', { name: m.from }) : t('help.you')} · <RelativeTime iso={m.at} />
              </p>
              <p className="mt-0.5 whitespace-pre-line text-[14px] text-foreground">{m.text}</p>
            </li>
          ))}
        </ol>
      </Disclosure>
    </li>
  );
}
