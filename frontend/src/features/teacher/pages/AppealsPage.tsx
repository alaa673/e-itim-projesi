import { CheckCircle2, MessageSquareWarning, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { type Appeal, appealApi } from '../services/teacherApi';

const TONE = { open: 'warning', accepted: 'success', rejected: 'danger' } as const;
type View = 'open' | 'closed';

export default function AppealsPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const { data, error, loading, reload } = useAsync((signal) => appealApi.list({ offset: 0, limit: 100, sortKey: 'createdAt', sortDirection: 'desc' }, signal), []);
  const [view, setView] = useState<View>('open');
  const [responding, setResponding] = useState<{ appeal: Appeal; decision: 'accepted' | 'rejected' } | null>(null);
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();
  const items = (data?.items ?? []).filter((a) => (view === 'open' ? a.status === 'open' : a.status !== 'open'));
  const openCount = (data?.items ?? []).filter((a) => a.status === 'open').length;

  return (
    <>
      <PageHeader title={t('nav.teacher.appeals', { ns: 'common' })} description={t('appeals.description')} />
      <Tabs<View>
        className="mb-4"
        label={t('appeals.viewLabel')}
        value={view}
        onChange={setView}
        items={[
          { value: 'open', label: t('appeals.open'), count: openCount },
          { value: 'closed', label: t('appeals.closed') },
        ]}
      />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {() =>
          items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<MessageSquareWarning className="h-5 w-5" aria-hidden />} title={t(view === 'open' ? 'appeals.emptyOpen' : 'appeals.emptyClosed')} />
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((a) => (
                <li key={a.id} className="panel p-5">
                  <div className="flex flex-wrap items-start gap-3">
                    <Avatar name={a.studentName} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {a.studentName} <span className="font-normal text-muted-foreground">· {a.className}</span>
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        {a.exam}
                        {a.questionNo !== null && ` · ${t('exams.questionNo', { number: a.questionNo })}`} · <RelativeTime iso={a.createdAt} />
                      </p>
                    </div>
                    <span className="flex gap-1.5">
                      <Badge tone="accent">{t(`appeals.kinds.${a.kind}`)}</Badge>
                      <Badge tone={TONE[a.status]} dot>
                        {t(`appeals.status.${a.status}`)}
                      </Badge>
                    </span>
                  </div>
                  <blockquote className="mt-3 rounded-[14px] border-l-4 border-primary/50 bg-surface-muted px-4 py-3 text-[14.5px] text-foreground">{a.message}</blockquote>
                  {a.response && (
                    <p className="mt-3 text-[14px] text-foreground">
                      <span className="font-semibold">{t('appeals.yourResponse')}:</span> {a.response}
                    </p>
                  )}
                  {a.status === 'open' && (
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <Button variant="secondary" className="text-danger" icon={<XCircle className="h-4 w-4" aria-hidden />} onClick={() => { setResponding({ appeal: a, decision: 'rejected' }); setText(''); setTouched(false); }}>
                        {t('actions.reject', { ns: 'common' })}
                      </Button>
                      <Button icon={<CheckCircle2 className="h-4 w-4" aria-hidden />} onClick={() => { setResponding({ appeal: a, decision: 'accepted' }); setText(''); setTouched(false); }}>
                        {t('appeals.accept')}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )
        }
      </AsyncContent>
      <Modal
        open={responding !== null}
        onClose={() => setResponding(null)}
        size="sm"
        preventClose={busy}
        title={responding ? t(responding.decision === 'accepted' ? 'appeals.acceptTitle' : 'appeals.rejectTitle') : ''}
        description={responding ? `${responding.appeal.studentName} · ${responding.appeal.exam}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setResponding(null)} disabled={busy}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button
              variant={responding?.decision === 'rejected' ? 'danger' : 'primary'}
              loading={busy}
              onClick={async () => {
                setTouched(true);
                if (!responding || text.trim().length < 5) return;
                const ok = await run(() => appealApi.update(responding.appeal.id, { status: responding.decision, response: text.trim() }), { success: t('appeals.responded') });
                if (ok) {
                  setResponding(null);
                  reload();
                }
              }}
            >
              {t('actions.send', { ns: 'common' })}
            </Button>
          </>
        }
      >
        <Textarea label={t('appeals.responseLabel')} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t(responding?.decision === 'accepted' ? 'appeals.acceptPlaceholder' : 'appeals.rejectPlaceholder')} error={touched && text.trim().length < 5 ? t('validation.tooShort', { ns: 'common' }) : undefined} />
        <p className="mt-2 text-[12.5px] text-muted-foreground">{t('appeals.note')}</p>
      </Modal>
    </>
  );
}
