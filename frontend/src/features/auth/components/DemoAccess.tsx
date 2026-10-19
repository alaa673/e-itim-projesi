import clsx from 'clsx';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ROLE_ICON, ROLES } from '@/config/roles';
import { DEMO_PASSWORD, DEMO_USERS } from '@/mocks/mockUsers';
import type { UserRole } from '@/types';

/**
 * Mock mode only (lazy-loaded): one-click demo sign-in cards. Never part of a real build.
 */
export default function DemoAccess({ busy, demoLoading, onEnter }: { busy: boolean; demoLoading: UserRole | null; onEnter: (role: UserRole) => void }) {
  const { t } = useTranslation(['auth', 'common']);
  return (
    <section aria-labelledby="demo-access-title" className="mt-6 rounded-[20px] border border-border bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="demo-access-title" className="font-display text-[16px] font-extrabold text-foreground">
          {t('demo.title')}
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-[12px] font-semibold text-warning">
          <FlaskConical className="h-3.5 w-3.5" aria-hidden />
          {t('demo.divider')}
        </span>
      </div>
      <p className="mt-1.5 text-[13.5px] leading-snug text-muted-foreground">{t('demo.intro')}</p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        {ROLES.map((role) => {
          const Icon = ROLE_ICON[role];
          const loadingThis = demoLoading === role;
          return (
            <button
              key={role}
              type="button"
              data-role={role}
              onClick={() => onEnter(role)}
              disabled={busy}
              aria-label={t('demo.as', { role: t(`roles.${role}`, { ns: 'common' }) })}
              aria-describedby={`demo-hint-${role}`}
              aria-busy={loadingThis || undefined}
              className={clsx(
                'group flex items-center gap-3 rounded-[16px] border bg-accent-soft p-3 text-left transition-[transform,box-shadow,border-color] duration-200 sm:flex-col sm:items-start',
                'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_14px_28px_-16px_rgb(var(--primary)/0.8)] disabled:cursor-wait disabled:hover:translate-y-0',
                loadingThis ? 'border-primary ring-[3px] ring-primary/25' : 'border-transparent',
                busy && !loadingThis && 'opacity-60',
              )}
            >
              <span className="icon-tile h-11 w-11 bg-primary text-primary-foreground shadow-[0_8px_16px_-8px_rgb(var(--primary)/0.9)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[15px] font-bold text-accent-ink">
                  {t(`roles.${role}`, { ns: 'common' })}
                  {loadingThis ? (
                    <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
                  ) : (
                    <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  )}
                </span>
                <span id={`demo-hint-${role}`} className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
                  {t(`roleHints.${role}`)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 break-words text-[12.5px] text-muted-foreground">
        {t('demo.credentials', { email: DEMO_USERS.teacher.email, password: DEMO_PASSWORD })}
      </p>
    </section>
  );
}
