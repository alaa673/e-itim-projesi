import { Lock, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { AsyncContent } from '@/components/ui/States';
import { Switch } from '@/components/ui/Switch';
import { SaveBar } from '../components/SaveBar';
import { useSettings } from '../hooks/useSettings';
import type { PermissionRule } from '../services/adminApi';

const GROUPS: PermissionRule['group'][] = ['users', 'content', 'exams', 'reports', 'communication'];
const ROLES = ['admin', 'teacher', 'student'] as const;

export default function PermissionsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const s = useSettings('permissions');

  return (
    <>
      <PageHeader title={t('permissions.title')} description={t('permissions.description')} />
      <p className="mb-4 flex gap-2 rounded-[14px] border border-border bg-surface px-4 py-3 text-[13.5px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" aria-hidden />
        {t('permissions.serverNote')}
      </p>
      <AsyncContent data={s.draft} error={s.error} loading={s.loading} reload={s.reload}>
        {(rules) => (
          <>
            <div className="space-y-6">
              {GROUPS.map((group) => (
                <Panel key={group} title={t(`permissions.groups.${group}`)} bodyClassName="px-0 sm:px-0">
                  <div className="relative overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left">
                      <caption className="sr-only">{t(`permissions.groups.${group}`)}</caption>
                      <thead className="bg-surface-muted text-[13px] text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-6 py-3 font-semibold">{t('permissions.permission')}</th>
                          {ROLES.map((r) => (
                            <th key={r} scope="col" className="w-[120px] px-3 py-3 text-center font-semibold">
                              {t(`roles.${r}`, { ns: 'common' })}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rules
                          .filter((r) => r.group === group)
                          .map((rule) => (
                            <tr key={rule.key} className="border-b border-border last:border-0">
                              <th scope="row" className="px-6 py-3 font-normal">
                                <span className="flex items-center gap-2 text-[14.5px] font-semibold text-foreground">
                                  {t(`permissions.rules.${rule.key}`)}
                                  {rule.locked && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label={t('permissions.locked')} />}
                                </span>
                                <span className="block text-[12.5px] text-muted-foreground">{t(`permissions.hints.${rule.key}`)}</span>
                              </th>
                              {ROLES.map((role) => (
                                <td key={role} className="px-3 py-3">
                                  <span className="flex justify-center">
                                    <Switch
                                      hideLabel
                                      label={`${t(`permissions.rules.${rule.key}`)} · ${t(`roles.${role}`, { ns: 'common' })}`}
                                      checked={rule[role]}
                                      disabled={rule.locked || role === 'admin'}
                                      onChange={(checked) => s.setDraft(rules.map((r) => (r.key === rule.key ? { ...r, [role]: checked } : r)))}
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
              ))}
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground">{t('permissions.adminNote')}</p>
            <SaveBar dirty={s.dirty} saving={s.saving} onReset={s.reset} onSave={() => void s.save()} />
          </>
        )}
      </AsyncContent>
    </>
  );
}
