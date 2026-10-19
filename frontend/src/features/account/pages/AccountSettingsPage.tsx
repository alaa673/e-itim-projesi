import clsx from 'clsx';
import { Bell, KeyRound, LogOut, Moon, Palette, ShieldCheck, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import { useTheme } from '@/app/providers/themeContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { AsyncContent } from '@/components/ui/States';
import { Switch } from '@/components/ui/Switch';
import { SUPPORTED_LOCALES } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { PasswordForm } from '../components/PasswordForm';
import { notificationPrefsApi } from '../services/accountApi';
import { NOTIFICATION_TOPICS, type NotificationPrefs } from '../types';

export default function AccountSettingsPage() {
  const { t } = useTranslation(['account', 'common']);
  return (
    <>
      <PageHeader title={t('nav.account.accountSettings', { ns: 'common' })} description={t('settings.description')} />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <PasswordPanel />
          <SessionPanel />
        </div>
        <div className="space-y-6">
          <AppearancePanel />
          <NotificationsPanel />
        </div>
      </div>
    </>
  );
}

/* ── Password ───────────────────────────────────────────────────────── */

function PasswordPanel() {
  const { t } = useTranslation(['account', 'common']);
  return (
    <Panel icon={KeyRound} title={t('settings.passwordTitle')} description={t('settings.passwordHint')}>
      <PasswordForm />
    </Panel>
  );
}

/* ── Appearance & language ──────────────────────────────────────────── */

const LANGUAGE_NAMES: Record<string, string> = { tr: 'Türkçe', en: 'English' };

function AppearancePanel() {
  const { t, i18n } = useTranslation(['account', 'common']);
  const { theme, setTheme } = useTheme();
  const lang = i18n.resolvedLanguage === 'en' ? 'en' : 'tr';
  return (
    <Panel icon={Palette} title={t('settings.appearanceTitle')} description={t('settings.appearanceHint')}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t('settings.theme')}>
          {(['light', 'dark'] as const).map((value) => {
            const on = theme === value;
            const Icon = value === 'light' ? Sun : Moon;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setTheme(value)}
                className={clsx('flex flex-col overflow-hidden rounded-[16px] border-2 text-left transition-colors', on ? 'border-primary' : 'border-border hover:border-primary/40')}
              >
                <span aria-hidden className={clsx('flex h-20 gap-1.5 p-2.5', value === 'light' ? 'bg-[#f4f2fb]' : 'bg-[#15121f]')}>
                  <span className={clsx('w-1/4 rounded-[8px]', value === 'light' ? 'bg-[#2a1f4d]' : 'bg-[#221c35]')} />
                  <span className="flex flex-1 flex-col gap-1.5">
                    <span className={clsx('h-3 w-2/3 rounded-full', value === 'light' ? 'bg-[#d9d3ee]' : 'bg-[#3a3254]')} />
                    <span className={clsx('flex-1 rounded-[8px]', value === 'light' ? 'bg-white' : 'bg-[#1f1a2e]')} />
                  </span>
                </span>
                <span className="flex items-center gap-2 px-3 py-2.5 text-[14.5px] font-semibold text-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                  {t(`settings.themes.${value}`)}
                </span>
              </button>
            );
          })}
        </div>
        <SegmentedControl label={t('settings.language')} value={lang} onChange={(v) => void i18n.changeLanguage(v)} options={SUPPORTED_LOCALES.map((l) => ({ value: l, label: LANGUAGE_NAMES[l] }))} />
        <p className="text-[12.5px] text-muted-foreground">{t('settings.localNote')}</p>
      </div>
    </Panel>
  );
}

/* ── Notifications ──────────────────────────────────────────────────── */

function NotificationsPanel() {
  const { t } = useTranslation(['account', 'common']);
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync((signal) => notificationPrefsApi.get(signal), []);
  const [draft, setDraft] = useState<NotificationPrefs | null>(null);
  const { run, busy } = useAction();
  useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);
  const dirty = Boolean(draft && data && JSON.stringify(draft) !== JSON.stringify(data));
  const topics = NOTIFICATION_TOPICS.filter((k) => !(k === 'results' && user?.role === 'admin'));

  return (
    <Panel icon={Bell} title={t('settings.notificationsTitle')} description={t('settings.notificationsHint')}>
      <AsyncContent data={draft} error={error} loading={loading} reload={reload}>
        {(d) => (
          <>
            <Switch className="rounded-[14px] bg-surface-muted px-4 py-3" checked={d.email} onChange={(email) => setDraft({ ...d, email })} label={t('settings.emailChannel')} description={t('settings.emailChannelHint')} />
            <ul className="mt-2 divide-y divide-border">
              {topics.map((k) => (
                <li key={k} className="py-3">
                  <Switch checked={d.topics[k]} onChange={(on) => setDraft({ ...d, topics: { ...d.topics, [k]: on } })} label={t(`settings.topics.${k}`)} description={t(`settings.topicHints.${k}`)} />
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="secondary" disabled={!dirty || busy} onClick={() => data && setDraft(structuredClone(data))}>
                {t('actions.reset', { ns: 'common' })}
              </Button>
              <Button
                variant="ink"
                loading={busy}
                disabled={!dirty}
                onClick={async () => {
                  const saved = await run(() => notificationPrefsApi.save(d), { success: t('settings.notificationsSaved') });
                  if (saved) reload();
                }}
              >
                {t('actions.saveChanges', { ns: 'common' })}
              </Button>
            </div>
          </>
        )}
      </AsyncContent>
    </Panel>
  );
}

/* ── Session ────────────────────────────────────────────────────────── */

function SessionPanel() {
  const { t } = useTranslation(['account', 'common']);
  const { logout, user, isDemo } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <Panel icon={ShieldCheck} title={t('settings.sessionTitle')}>
      <p className="text-[14px] text-muted-foreground">{t(isDemo ? 'settings.sessionDemo' : 'settings.sessionReal', { email: user?.email ?? '' })}</p>
      <Button
        className="mt-4"
        variant="secondary"
        loading={busy}
        icon={<LogOut className="h-4 w-4" aria-hidden />}
        onClick={async () => {
          setBusy(true);
          await logout();
          navigate('/login', { replace: true });
        }}
      >
        {t('actions.signOut', { ns: 'common' })}
      </Button>
    </Panel>
  );
}
