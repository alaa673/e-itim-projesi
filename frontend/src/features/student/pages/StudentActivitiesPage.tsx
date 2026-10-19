import { CheckCircle2, PartyPopper, User, UserPlus, UsersRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { formatDate, formatTime } from '@/utils/format';
import { activityApi } from '../services/studentApi';

const TONE = { upcoming: 'info', joined: 'lime', completed: 'success' } as const;

export default function StudentActivitiesPage() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const { data, error, loading, reload } = useAsync((signal) => activityApi.list({ offset: 0, limit: 100, sortKey: 'date' }, signal), []);
  const { run, busy } = useAction();

  return (
    <>
      <PageHeader title={t('nav.student.activities', { ns: 'common' })} description={t('activities.description')} />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(page) =>
          page.items.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<PartyPopper className="h-5 w-5" aria-hidden />} title={t('activities.empty')} />
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {page.items.map((a) => {
                const Icon = a.kind === 'group' ? UsersRound : User;
                return (
                  <li key={a.id} className="panel flex flex-col p-5">
                    <div className="flex items-start gap-3">
                      <span className={`icon-tile h-11 w-11 ${a.kind === 'group' ? 'bg-tint-mint text-ink-mint' : 'bg-tint-sky text-ink-sky'}`}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-[17px] font-extrabold text-foreground">{a.title}</h2>
                        <p className="text-[13px] text-muted-foreground">
                          {a.subject} · {formatDate(a.date, locale, { day: 'numeric', month: 'long', weekday: 'short' })} {formatTime(a.date, locale)}
                        </p>
                      </div>
                      <Badge tone={TONE[a.status]} dot>
                        {t(`activities.status.${a.status}`)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-[14px] leading-relaxed text-foreground">{a.instructions}</p>
                    <p className="mt-2 text-[12.5px] text-muted-foreground">{t(`activities.kinds.${a.kind}`)}</p>
                    <div className="mt-auto flex justify-end pt-4">
                      {a.status === 'upcoming' && (
                        <Button
                          size="sm"
                          variant="soft"
                          loading={busy}
                          icon={<UserPlus className="h-4 w-4" aria-hidden />}
                          onClick={async () => {
                            const ok = await run(() => activityApi.update(a.id, { status: 'joined' }), { success: t('activities.joined', { title: a.title }) });
                            if (ok) reload();
                          }}
                        >
                          {t('activities.join')}
                        </Button>
                      )}
                      {a.status === 'joined' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            const ok = await run(() => activityApi.update(a.id, { status: 'upcoming' }), { success: t('activities.left') });
                            if (ok) reload();
                          }}
                        >
                          {t('activities.leave')}
                        </Button>
                      )}
                      {a.status === 'completed' && <CheckCircle2 className="h-6 w-6 text-success" aria-label={t('activities.status.completed')} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        }
      </AsyncContent>
    </>
  );
}
