import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowRight, Eye, EyeOff, HelpCircle, Info, Lock, ShieldCheck, UserRound } from 'lucide-react';
import { type KeyboardEvent, lazy, Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import loginHero from '@/assets/illustrations/login-hero.webp';
import { PusulaLogo } from '@/components/brand/PusulaLogo';
import { Burst, Sparkle } from '@/components/brand/Sparkle';
import { LanguageMenu } from '@/components/layout/LanguageMenu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/Spinner';
import { IS_MOCK_MODE, PRIVACY_URL } from '@/config/constants';
import { ROLE_HOME, ROLE_PREFIX } from '@/config/roles';
import type { User, UserRole } from '@/types';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiError, errorMessageKey } from '@/utils/errorHandling';
import { loginSchema, type LoginFormValues } from '../validation';

const DemoAccess = IS_MOCK_MODE ? lazy(() => import('../components/DemoAccess')) : null;


/** React 18 only forwards the lowercase attribute; it makes the browser fetch the hero image first. */
const HERO_PRIORITY = { fetchpriority: 'high' } as Record<string, string>;

export function LoginPage() {
  const { t } = useTranslation(['auth', 'common']);
  const { status, user, login, loginAsDemo, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState<UserRole | null>(null);
  const [helpOpen, setHelpOpen] = useState<'forgot' | 'help' | 'privacy' | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: '', password: '', remember: false } });

  // Only return to the originally requested page when it is inside the user's own area.
  const destinationFor = (signedIn: User) => {
    const from = (location.state as { from?: string } | null)?.from;
    return from && from.startsWith(ROLE_PREFIX[signedIn.role]) ? from : ROLE_HOME[signedIn.role];
  };
  const goToDestination = (signedIn: User) =>
    signedIn.mustChangePassword
      ? navigate('/change-password', { replace: true, state: { from: destinationFor(signedIn) } })
      : navigate(destinationFor(signedIn), { replace: true });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      goToDestination(await login(values));
    } catch (error) {
      setFormError(
        error instanceof ApiError && error.kind === 'unauthorized' ? t('invalidCredentials') : t(errorMessageKey(error), { ns: 'common' }),
      );
    }
  });

  const enterAsDemo = async (role: UserRole) => {
    setFormError(null);
    setDemoLoading(role);
    try {
      goToDestination(await loginAsDemo(role));
    } catch (error) {
      setFormError(t(errorMessageKey(error), { ns: 'common' }));
      setDemoLoading(null);
    }
  };

  useDocumentTitle(t('submit'));

  const trackCapsLock = (event: KeyboardEvent<HTMLInputElement>) => setCapsLock(event.getModifierState?.('CapsLock') ?? false);

  if (status === 'restoring') return <LoadingSpinner label={t('states.loading', { ns: 'common' })} />;
  if (status === 'authenticated' && user) return <Navigate to={destinationFor(user)} replace />;

  const busy = demoLoading !== null || isSubmitting;

  return (
    <div className="relative min-h-full bg-background lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
      {/* ── Brand illustration (desktop: left panel · mobile: header) ── */}
      <section aria-label={t('hero.label')} className="relative isolate h-[300px] overflow-hidden sm:h-[360px] lg:sticky lg:top-0 lg:h-screen">
        <img src={loginHero} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover object-[68%_100%] lg:object-[62%_100%]" decoding="async" {...HERO_PRIORITY} />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(30_14_74/0.55)_0%,rgb(30_14_74/0.15)_45%,transparent_70%)]" />
        <div className="flex h-full flex-col px-6 pt-6 sm:px-10 sm:pt-9 lg:px-14 lg:pt-12">
          <PusulaLogo size="lg" />
          <div className="mt-6 max-w-[560px] sm:mt-10 lg:mt-[9vh]">
            <p className="font-display text-[34px] font-extrabold leading-[1.02] tracking-[-0.035em] text-white drop-shadow-[0_2px_18px_rgb(20_8_60/0.45)] sm:text-[48px] lg:text-[64px]">
              {t('hero.title')}
            </p>
            <p className="mt-3 text-[16px] font-medium text-white/90 sm:text-[19px] lg:text-[22px]">{t('hero.lead')}</p>
          </div>
          <p className="mt-auto hidden pb-8 text-[12.5px] text-white/80 lg:block">{t('hero.illustrative')}</p>
        </div>
        <Sparkle className="absolute right-[18%] top-[12%] hidden h-6 w-6 text-brand-amber motion-safe:animate-twinkle sm:block" />
        <Sparkle className="absolute left-[22%] top-[44%] hidden h-5 w-5 text-brand-amber/90 motion-safe:animate-twinkle lg:block" />
        {/* curved seam into the form side */}
        <svg aria-hidden viewBox="0 0 100 1000" preserveAspectRatio="none" className="absolute inset-y-0 right-0 hidden h-full w-[90px] lg:block">
          <path d="M100 0H48C76 170 28 330 52 520C70 660 34 800 58 1000H100Z" fill="rgb(var(--background))" />
        </svg>
        <svg aria-hidden viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[34px] w-full lg:hidden">
          <path d="M0 100V60C220 10 420 90 620 50C780 20 900 40 1000 70V100Z" fill="rgb(var(--background))" />
        </svg>
      </section>

      {/* ── Sign-in ── */}
      <main className="relative flex min-h-full flex-col px-5 pb-8 sm:px-10 lg:min-h-screen lg:px-14">
        <div className="flex items-center justify-end gap-2 pt-4 sm:pt-6">
          <ThemeToggle className="h-12 w-12 rounded-[14px]" />
          <LanguageMenu />
        </div>

        <div className="flex flex-1 items-center justify-center py-6 lg:py-10">
          <div className="w-full max-w-[520px] motion-safe:animate-rise-in">
            <p className="inline-flex rounded-full border-2 border-primary/60 px-3.5 py-1 text-[13px] font-extrabold uppercase tracking-[0.08em] text-accent-ink">
              {t('badge')}
            </p>
            <h1 className="mt-4 font-display text-[36px] font-extrabold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[48px]">{t('title')}</h1>
            <p className="mt-2 text-[16.5px] text-muted-foreground sm:text-[18px]">{t('subtitle')}</p>

            <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
              {sessionExpired && !formError && (
                <div role="status" className="flex gap-3 rounded-[14px] border border-info/25 bg-info/[0.07] p-3.5">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden />
                  <p className="text-[14px] text-foreground">{t('sessionExpired')}</p>
                </div>
              )}
              {formError && (
                <div role="alert" className="flex gap-3 rounded-[14px] border border-danger/25 bg-danger/[0.07] p-3.5">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-danger">{t('errorTitle')}</p>
                    <p className="mt-0.5 text-[13.5px] text-foreground">{formError}</p>
                  </div>
                </div>
              )}
              <Input
                size="lg"
                label={t('identifier')}
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={t('identifierPlaceholder')}
                leading={<UserRound className="h-5 w-5" aria-hidden />}
                error={errors.identifier?.message ? t(errors.identifier.message) : undefined}
                {...register('identifier')}
              />
              <Input
                size="lg"
                label={t('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t('passwordPlaceholder')}
                leading={<Lock className="h-5 w-5" aria-hidden />}
                hint={capsLock ? t('capsLock') : undefined}
                onKeyUp={trackCapsLock}
                error={errors.password?.message ? t(errors.password.message) : undefined}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    aria-pressed={showPassword}
                    className="flex h-10 w-10 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                  </button>
                }
                {...register('password')}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Checkbox label={t('remember')} {...register('remember')} />
                <button type="button" onClick={() => setHelpOpen('forgot')} className="text-[15px] font-semibold text-accent-ink underline decoration-2 underline-offset-4 hover:decoration-primary">
                  {t('forgot')}
                </button>
              </div>
              <div className="relative">
                <Button type="submit" variant="ink" size="lg" className="group h-14 w-full rounded-[16px] text-[17px]" loading={isSubmitting} disabled={demoLoading !== null} iconEnd={<ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />}>
                  {isSubmitting ? t('submitting') : t('submit')}
                </Button>
                <Burst className="pointer-events-none absolute -right-7 -top-6 hidden h-7 w-7 rotate-12 text-brand-amber sm:block" />
              </div>
            </form>

            <div className="mt-8 border-t border-border pt-6 text-center">
              <p className="text-[15px] text-foreground">{t('noAccount')}</p>
              <p className="mt-1.5 text-[13.5px] text-muted-foreground">{t('firstLoginNote')}</p>
            </div>

            {DemoAccess && (
              <Suspense fallback={null}>
                <DemoAccess busy={busy} demoLoading={demoLoading} onEnter={(role) => void enterAsDemo(role)} />
              </Suspense>
            )}
          </div>
        </div>

        <nav aria-label={t('footerNav')} className="flex items-center justify-center gap-5 text-[14px] text-muted-foreground">
          <button type="button" onClick={() => setHelpOpen('help')} className="inline-flex items-center gap-1.5 hover:text-foreground">
            <HelpCircle className="h-4 w-4" aria-hidden />
            {t('help.link')}
          </button>
          <span aria-hidden className="h-4 w-px bg-border" />
          {PRIVACY_URL ? (
            <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {t('privacy.link')}
            </a>
          ) : (
            <button type="button" onClick={() => setHelpOpen('privacy')} className="inline-flex items-center gap-1.5 hover:text-foreground">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {t('privacy.link')}
            </button>
          )}
          <span aria-hidden className="hidden h-4 w-px bg-border sm:block" />
          <span className="hidden sm:inline">
            {t('app.name', { ns: 'common' })} · {t('app.tagline', { ns: 'common' })}
          </span>
        </nav>
      </main>

      <Modal
        open={helpOpen !== null}
        onClose={() => setHelpOpen(null)}
        size="sm"
        title={helpOpen === 'forgot' ? t('forgotDialog.title') : helpOpen === 'privacy' ? t('privacy.title') : t('help.title')}
        footer={
          <Button variant="ink" onClick={() => setHelpOpen(null)}>
            {t('actions.close', { ns: 'common' })}
          </Button>
        }
      >
        {helpOpen === 'forgot' ? (
          <div className="space-y-3 text-[15px] text-foreground">
            <p>{t('forgotDialog.body')}</p>
            <p className="text-muted-foreground">{t('forgotDialog.note')}</p>
          </div>
        ) : helpOpen === 'privacy' ? (
          <div className="space-y-3 text-[15px] text-foreground">
            <p>{t('privacy.body')}</p>
            <p className="text-muted-foreground">{t('privacy.contact')}</p>
          </div>
        ) : (
          <ul className="list-disc space-y-2 pl-5 text-[15px] text-foreground">
            <li>{t('help.item1')}</li>
            <li>{t('help.item2')}</li>
            <li>{t('help.item3')}</li>
          </ul>
        )}
      </Modal>
    </div>
  );
}
