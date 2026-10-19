import { BadgeCheck, CalendarClock, KeyRound, LifeBuoy, Lock, Mail, Save, School } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { DetailList } from '@/components/ui/DetailList';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { AsyncContent } from '@/components/ui/States';
import { Textarea } from '@/components/ui/Textarea';
import { ROLE_PREFIX } from '@/config/roles';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { formatDate } from '@/utils/format';
import { profileApi } from '../services/accountApi';
import type { AccountProfile } from '../types';

const PHONE = /^[+0-9 ()-]{10,20}$/;

export default function ProfilePage() {
  const { t } = useTranslation(['account', 'common']);
  const { data, error, loading, reload } = useAsync((signal) => profileApi.get(signal), []);

  return (
    <>
      <PageHeader title={t('nav.account.profile', { ns: 'common' })} description={t('profile.description')} />
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {(profile) => (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <IdentityCard profile={profile} />
            <ContactForm profile={profile} onSaved={reload} />
          </div>
        )}
      </AsyncContent>
    </>
  );
}

function IdentityCard({ profile }: { profile: AccountProfile }) {
  const { t } = useTranslation(['account', 'common']);
  const locale = useLocale();
  const name = `${profile.firstName} ${profile.lastName}`;
  const prefix = ROLE_PREFIX[profile.role];
  return (
    <section aria-labelledby="profile-name" className="panel overflow-hidden">
      <div className="relative h-28 bg-[linear-gradient(120deg,rgb(var(--primary))_0%,rgb(var(--primary)/0.55)_60%,rgb(var(--lime))_140%)]">
        <span aria-hidden className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <span aria-hidden className="absolute right-24 top-6 h-10 w-10 rounded-full bg-white/15" />
      </div>
      <div className="px-6 pb-6">
        <div className="-mt-12 flex">
          <Avatar name={name} src={profile.avatarUrl} size={96} className="ring-4 ring-surface" />
        </div>
        <h2 id="profile-name" className="mt-3 font-display text-[24px] font-extrabold leading-tight text-foreground">
          {name}
        </h2>
        <p className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge tone="accent" icon={<BadgeCheck className="h-3.5 w-3.5" aria-hidden />}>
            {t(`roles.${profile.role}`, { ns: 'common' })}
          </Badge>
          {profile.className && <Badge tone="neutral">{t('profile.classBadge', { cls: profile.className })}</Badge>}
        </p>

        <DetailList
          className="mt-6"
          items={[
            { label: t('profile.email'), value: <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4 text-muted-foreground" aria-hidden />{profile.email}</span>, full: true },
            { label: t('profile.institution'), value: <span className="inline-flex items-center gap-1.5"><School className="h-4 w-4 text-muted-foreground" aria-hidden />{profile.institution}</span> },
            ...(profile.role === 'student'
              ? [
                  { label: t('profile.class'), value: profile.className },
                  { label: t('profile.schoolNumber'), value: profile.schoolNumber },
                ]
              : []),
            ...(profile.role === 'teacher'
              ? [
                  { label: t('profile.subjects'), value: profile.subjects.join(', ') || '—' },
                  { label: t('profile.classes'), value: profile.classes.join(', ') || '—' },
                ]
              : []),
            { label: t('profile.memberSince'), value: formatDate(profile.memberSince, locale, { year: 'numeric', month: 'long' }) },
            { label: t('profile.lastLogin'), value: <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden /><RelativeTime iso={profile.lastLoginAt} /></span> },
          ]}
        />

        <p className="mt-6 flex items-start gap-2 rounded-[14px] bg-surface-muted px-4 py-3 text-[13.5px] text-muted-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t(profile.role === 'admin' ? 'profile.managedAdmin' : 'profile.managed')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`${prefix}/account/settings`} className={buttonClass('secondary', 'sm')}>
            <KeyRound className="h-4 w-4" aria-hidden />
            {t('nav.account.accountSettings', { ns: 'common' })}
          </Link>
          {profile.role !== 'admin' && (
            <Link to={`${prefix}/help`} className={buttonClass('ghost', 'sm')}>
              <LifeBuoy className="h-4 w-4" aria-hidden />
              {t('profile.reportWrong')}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function ContactForm({ profile, onSaved }: { profile: AccountProfile; onSaved: () => void }) {
  const { t } = useTranslation(['account', 'common']);
  const [phone, setPhone] = useState(profile.phone);
  const [about, setAbout] = useState(profile.about);
  const [touched, setTouched] = useState(false);
  const { run, busy } = useAction();
  useEffect(() => {
    setPhone(profile.phone);
    setAbout(profile.about);
  }, [profile]);

  const phoneError = touched && phone.trim() !== '' && !PHONE.test(phone.trim()) ? t('validation.phone', { ns: 'common' }) : undefined;
  const dirty = phone !== profile.phone || about !== profile.about;

  return (
    <Panel title={t('profile.contactTitle')} description={t('profile.contactHint')}>
      <form
        noValidate
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setTouched(true);
          if (phone.trim() !== '' && !PHONE.test(phone.trim())) return;
          const ok = await run(() => profileApi.update({ phone: phone.trim(), about: about.trim() }), {
            success: t('profile.saved'),
          });
          if (ok) {
            setTouched(false);
            onSaved();
          }
        }}
      >
        <Input label={t('profile.phone')} type="tel" autoComplete="tel" placeholder="05xx xxx xx xx" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched(true)} error={phoneError} hint={t('profile.phoneHint')} />
        <Textarea label={t('profile.about')} rows={5} maxLength={300} value={about} onChange={(e) => setAbout(e.target.value)} hint={t('profile.aboutHint', { count: 300 - about.length })} />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!dirty || busy}
            onClick={() => {
              setPhone(profile.phone);
              setAbout(profile.about);
              setTouched(false);
            }}
          >
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" variant="ink" loading={busy} disabled={!dirty} icon={<Save className="h-4 w-4" aria-hidden />}>
            {t('actions.saveChanges', { ns: 'common' })}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
