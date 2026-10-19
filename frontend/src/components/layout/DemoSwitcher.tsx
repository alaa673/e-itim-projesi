import clsx from 'clsx';
import { Check, ChevronDown, GraduationCap } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import { ROLE_HOME } from '@/config/roles';
import { useDismiss } from '@/hooks/useDismiss';
import { DEMO_USERS } from '@/mocks/mockUsers';
import type { DemoProfile } from '@/types';

const PROFILES: DemoProfile[] = ['admin', 'teacher', 'student', 'studentHigh'];

/**
 * "Örnek … ekranı" pill: tells the viewer this is a demo with sample data, and switches demo profile.
 * Only rendered in mock mode.
 */
export function DemoSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { user, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  if (!user) return null;
  const current = (Object.keys(DEMO_USERS) as DemoProfile[]).find((p) => DEMO_USERS[p].id === user.id) ?? user.role;

  const pick = async (profile: DemoProfile) => {
    setOpen(false);
    const next = await loginAsDemo(profile);
    navigate(ROLE_HOME[next.role]);
  };

  return (
    <div ref={ref} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={t('header.demoHint')}
        className="inline-flex h-12 items-center gap-2 rounded-[14px] bg-accent-soft px-4 text-[14px] font-semibold text-accent-ink transition-colors hover:bg-primary/[0.14]"
      >
        <GraduationCap className="h-5 w-5" aria-hidden />
        <span className="hidden xl:inline">{t(`demo.screen.${user.role}`)}</span>
        <span className="sr-only xl:hidden">{t(`demo.screen.${user.role}`)}</span>
        <ChevronDown className="h-4 w-4" aria-hidden />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-40 w-[290px] animate-pop-in rounded-[18px] border border-border bg-surface-elevated p-1.5 shadow-pop">
          <p className="px-3 pb-2 pt-2 text-[12.5px] leading-snug text-muted-foreground">{t('header.demoHint')}</p>
          {PROFILES.map((profile) => (
            <button
              key={profile}
              type="button"
              role="menuitemradio"
              aria-checked={current === profile}
              onClick={() => void pick(profile)}
              className="flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-left text-[14.5px] font-medium text-foreground hover:bg-accent-soft hover:text-accent-ink"
            >
              <span className="min-w-0 flex-1">
                <span className="block">{t(`demo.profile.${profile}`)}</span>
                <span className="block text-[12.5px] text-muted-foreground">
                  {DEMO_USERS[profile].firstName} {DEMO_USERS[profile].lastName}
                </span>
              </span>
              {current === profile && <Check className="h-4 w-4 text-accent-ink" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
