import { BellRing, Mail, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { AsyncContent } from '@/components/ui/States';
import { Switch } from '@/components/ui/Switch';
import { SaveBar } from '../components/SaveBar';
import { useSettings } from '../hooks/useSettings';
import type { IntegrationSettings } from '../services/adminApi';

const EVENTS = ['examAssigned', 'resultPublished', 'homeworkDue', 'meetingReminder', 'announcement'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function IntegrationsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const s = useSettings('integrations');

  return (
    <>
      <PageHeader title={t('integrations.title')} description={t('integrations.description')} />
      <AsyncContent data={s.draft} error={s.error} loading={s.loading} reload={s.reload}>
        {(d) => {
          const set = (patch: Partial<IntegrationSettings>) => s.setDraft({ ...d, ...patch });
          const urlError = d.meetingBaseUrl && !/^https:\/\//.test(d.meetingBaseUrl) ? t('institution.httpsOnly') : undefined;
          const mailError = d.emailEnabled && !EMAIL_RE.test(d.senderAddress) ? t('validation.email', { ns: 'common' }) : undefined;
          return (
            <>
              <div className="grid gap-6 xl:grid-cols-2">
                <Panel icon={Video} title={t('integrations.meetings')} description={t('integrations.meetingsHint')}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      label={t('integrations.provider')}
                      value={d.meetingProvider}
                      onChange={(e) => set({ meetingProvider: e.target.value as IntegrationSettings['meetingProvider'] })}
                      options={(['jitsi', 'meet', 'teams', 'zoom'] as const).map((v) => ({ value: v, label: t(`integrations.providers.${v}`) }))}
                    />
                    <Input label={t('integrations.baseUrl')} type="url" value={d.meetingBaseUrl} onChange={(e) => set({ meetingBaseUrl: e.target.value })} error={urlError} />
                  </div>
                  <p className="mt-3 text-[12.5px] text-muted-foreground">{t('integrations.oauthNote')}</p>
                </Panel>
                <Panel
                  icon={Mail}
                  title={t('integrations.email')}
                  action={
                    <Badge tone={d.smtpStatus === 'connected' ? 'success' : 'warning'} dot>
                      {t(`integrations.smtp.${d.smtpStatus}`)}
                    </Badge>
                  }
                >
                  <Switch label={t('integrations.emailEnabled')} description={t('integrations.emailEnabledHint')} checked={d.emailEnabled} onChange={(v) => set({ emailEnabled: v })} />
                  <Input containerClassName="mt-4" label={t('integrations.sender')} type="email" value={d.senderAddress} disabled={!d.emailEnabled} onChange={(e) => set({ senderAddress: e.target.value })} error={mailError} />
                  <p className="mt-3 text-[12.5px] text-muted-foreground">{t('integrations.smtpNote')}</p>
                </Panel>
              </div>

              <Panel className="mt-6" icon={BellRing} title={t('integrations.notifications')} description={t('integrations.notificationsHint')} bodyClassName="px-0 sm:px-0">
                <div className="relative overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left">
                    <caption className="sr-only">{t('integrations.notifications')}</caption>
                    <thead className="bg-surface-muted text-[13px] text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-6 py-3 font-semibold">{t('integrations.event')}</th>
                        <th scope="col" className="w-[140px] px-3 py-3 text-center font-semibold">{t('integrations.inApp')}</th>
                        <th scope="col" className="w-[140px] px-3 py-3 text-center font-semibold">{t('integrations.byEmail')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EVENTS.map((ev) => (
                        <tr key={ev} className="border-b border-border last:border-0">
                          <th scope="row" className="px-6 py-3 text-[14.5px] font-semibold text-foreground">{t(`integrations.events.${ev}`)}</th>
                          {(['inApp', 'email'] as const).map((ch) => (
                            <td key={ch} className="px-3 py-3">
                              <span className="flex justify-center">
                                <Switch
                                  hideLabel
                                  label={`${t(`integrations.events.${ev}`)} · ${t(ch === 'inApp' ? 'integrations.inApp' : 'integrations.byEmail')}`}
                                  checked={d.notify[ev][ch]}
                                  disabled={ch === 'email' && !d.emailEnabled}
                                  onChange={(v) => set({ notify: { ...d.notify, [ev]: { ...d.notify[ev], [ch]: v } } })}
                                />
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
              <SaveBar dirty={s.dirty} saving={s.saving} onReset={s.reset} onSave={() => !urlError && !mailError && void s.save()} />
            </>
          );
        }}
      </AsyncContent>
    </>
  );
}
