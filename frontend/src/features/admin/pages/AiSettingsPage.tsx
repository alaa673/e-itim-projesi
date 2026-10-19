import { Bot, KeyRound, PlugZap, ShieldCheck } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { AsyncContent } from '@/components/ui/States';
import { Switch } from '@/components/ui/Switch';
import { IS_MOCK_MODE } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { SaveBar } from '../components/SaveBar';
import { useSettings } from '../hooks/useSettings';
import { type AiSettings, settingsApi } from '../services/adminApi';

const PROVIDERS: AiSettings['provider'][] = ['anthropic', 'openai', 'google', 'azure'];
const FEATURES = ['pdfExtraction', 'summaries', 'questionGeneration', 'presentations', 'guidance'] as const;

export default function AiSettingsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const s = useSettings('ai');
  const [key, setKey] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [test, setTest] = useState<{ ok: boolean; latencyMs: number } | null>(null);
  const [keyInfo, setKeyInfo] = useState<Pick<AiSettings, 'keyStatus' | 'keyHint'> | null>(null);
  const { run, busy } = useAction();

  const sendKey = async (e: FormEvent) => {
    e.preventDefault();
    const value = key.trim();
    if (value.length < 20) {
      setKeyError(t('aiSettings.keyTooShort'));
      return;
    }
    setKey(''); // never keep the secret in component state longer than needed
    const saved = await run(() => settingsApi.setAiKey(value), { success: t('aiSettings.keySaved'), description: IS_MOCK_MODE ? t('aiSettings.keyDemo') : undefined });
    if (saved) setKeyInfo({ keyStatus: saved.keyStatus, keyHint: saved.keyHint });
  };

  return (
    <>
      <PageHeader title={t('aiSettings.title')} description={t('aiSettings.description')} />
      <AsyncContent data={s.draft} error={s.error} loading={s.loading} reload={s.reload}>
        {(d) => {
          const set = (patch: Partial<AiSettings>) => s.setDraft({ ...d, ...patch });
          const keyStatus = keyInfo?.keyStatus ?? d.keyStatus;
          const keyHint = keyInfo?.keyHint ?? d.keyHint;
          return (
            <>
              <div className="grid gap-6 xl:grid-cols-2">
                <Panel icon={KeyRound} title={t('aiSettings.connection')}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select label={t('aiSettings.provider')} value={d.provider} onChange={(e) => set({ provider: e.target.value as AiSettings['provider'] })} options={PROVIDERS.map((p) => ({ value: p, label: t(`aiSettings.providers.${p}`) }))} />
                    <Input label={t('aiSettings.model')} value={d.model} onChange={(e) => set({ model: e.target.value })} hint={t('aiSettings.modelHint')} />
                  </div>
                  <div className="mt-5 rounded-[16px] border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[14.5px] font-semibold text-foreground">{t('aiSettings.apiKey')}</p>
                      {keyStatus === 'configured' ? (
                        <Badge tone="success" dot>
                          {t('aiSettings.keyConfigured', { hint: keyHint ?? '••••' })}
                        </Badge>
                      ) : (
                        <Badge tone="warning">{t('aiSettings.keyMissing')}</Badge>
                      )}
                    </div>
                    <form onSubmit={sendKey} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end" autoComplete="off">
                      <Input
                        containerClassName="flex-1"
                        label={t('aiSettings.newKey')}
                        type="password"
                        autoComplete="new-password"
                        spellCheck={false}
                        value={key}
                        onChange={(e) => {
                          setKey(e.target.value);
                          setKeyError(null);
                        }}
                        error={keyError ?? undefined}
                      />
                      <Button type="submit" variant="secondary" loading={busy} disabled={!key}>
                        {t('aiSettings.sendKey')}
                      </Button>
                    </form>
                    <p className="mt-3 flex gap-2 text-[12.5px] text-muted-foreground">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                      {t('aiSettings.keyPolicy')}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      variant="soft"
                      icon={<PlugZap className="h-4 w-4" aria-hidden />}
                      loading={busy}
                      onClick={async () => {
                        const res = await run(() => settingsApi.testAi());
                        if (res) setTest(res);
                      }}
                    >
                      {t('aiSettings.test')}
                    </Button>
                    {test && (
                      <span role="status" className={test.ok ? 'text-[13.5px] text-success' : 'text-[13.5px] text-danger'}>
                        {test.ok ? t('aiSettings.testOk', { ms: test.latencyMs }) : t('aiSettings.testFail')}
                        {IS_MOCK_MODE && ` (${t('aiSettings.simulated')})`}
                      </span>
                    )}
                    {d.lastTestAt && !test && (
                      <span className="text-[13px] text-muted-foreground">
                        {t('aiSettings.lastTest')}: <RelativeTime iso={d.lastTestAt} />
                      </span>
                    )}
                  </div>
                </Panel>

                <Panel icon={Bot} title={t('aiSettings.limits')}>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input label={t('aiSettings.monthlyBudget')} type="number" min={0} step={100} value={d.monthlyBudget} onChange={(e) => set({ monthlyBudget: Math.max(0, Number(e.target.value)) })} hint="₺" />
                    <Input label={t('aiSettings.teacherDaily')} type="number" min={0} value={d.teacherDailyLimit} onChange={(e) => set({ teacherDailyLimit: Math.max(0, Number(e.target.value)) })} />
                    <Input label={t('aiSettings.studentDaily')} type="number" min={0} value={d.studentDailyLimit} onChange={(e) => set({ studentDailyLimit: Math.max(0, Number(e.target.value)) })} />
                  </div>
                  <h3 className="mt-6 text-[14.5px] font-bold text-foreground">{t('aiSettings.features')}</h3>
                  <div className="mt-3 divide-y divide-border rounded-[16px] border border-border">
                    {FEATURES.map((f) => (
                      <Switch
                        key={f}
                        className="px-4 py-3"
                        label={t(`aiUsage.features.${f}`)}
                        description={t(`aiSettings.featureHints.${f}`)}
                        checked={d.features[f]}
                        onChange={(checked) => set({ features: { ...d.features, [f]: checked } })}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-[12.5px] text-muted-foreground">{t('aiSettings.reviewNote')}</p>
                </Panel>
              </div>
              <SaveBar dirty={s.dirty} saving={s.saving} onReset={s.reset} onSave={() => void s.save()} />
            </>
          );
        }}
      </AsyncContent>
    </>
  );
}
