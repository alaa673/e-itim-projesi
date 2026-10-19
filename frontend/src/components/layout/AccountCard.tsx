import clsx from 'clsx';
import { KeyRound, LifeBuoy, LogOut, Settings, UserRound } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import { Avatar } from '@/components/ui/Avatar';
import { ROLE_PREFIX } from '@/config/roles';
import { useDismiss } from '@/hooks/useDismiss';
import type { User } from '@/types';
import { LanguageSwitcher } from './LanguageSwitcher';

/** Who the user is, as shown under their name. */
function useUserSubtitle(user: User): string {
  const { t } = useTranslation();
  if (user.role === 'student') return user.grade ? t('gradeLabel', { grade: user.grade }) : t('roles.student');
  if (user.role === 'teacher') return user.subjects?.length ? t('account.teacherOf', { subject: user.subjects[0] }) : t('roles.teacher');
  return t('account.institutionAdmin');
}

/** Sidebar footer: the signed-in person, with the account menu (profile, settings, help, language, sign out). */
export function AccountCard({ user }: { user: User }) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const fullName = `${user.firstName} ${user.lastName}`;
  const prefix = ROLE_PREFIX[user.role];
  const subtitle = useUserSubtitle(user);

  const signOut = async () => {
    setOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const itemClass =
    'flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14.5px] font-medium text-foreground transition-colors hover:bg-accent-soft hover:text-accent-ink';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('header.userMenu')}
        className="flex w-full items-center gap-3 rounded-[18px] border border-white/10 bg-black/25 p-3 text-left backdrop-blur-sm transition-colors hover:bg-black/35"
      >
        <Avatar name={fullName} src={user.avatarUrl} size={48} className="ring-2 ring-white/20" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[16px] font-bold text-white">{fullName}</span>
          <span className="mt-0.5 block truncate text-[13px] text-sidebar-muted">{subtitle}</span>
        </span>
        <Settings className={clsx('h-5 w-5 shrink-0 text-sidebar-foreground transition-transform', open && 'rotate-45')} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+10px)] left-0 right-0 z-50 animate-pop-in overflow-hidden rounded-[18px] border border-border bg-[rgb(var(--sidebar-2))] p-1.5 text-foreground shadow-pop"
        >
          <div className="mb-1 border-b border-border px-3 pb-3 pt-2">
            <p className="truncate font-semibold">{fullName}</p>
            <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
          </div>
          <Link role="menuitem" to={`${prefix}/account/profile`} className={itemClass} onClick={close}>
            <UserRound className="h-4 w-4" aria-hidden /> {t('nav.account.profile')}
          </Link>
          <Link role="menuitem" to={`${prefix}/account/settings`} className={itemClass} onClick={close}>
            <KeyRound className="h-4 w-4" aria-hidden /> {t('nav.account.accountSettings')}
          </Link>
          <Link role="menuitem" to={`${prefix}/help`} className={itemClass} onClick={close}>
            <LifeBuoy className="h-4 w-4" aria-hidden /> {t('sidebar.help')}
          </Link>
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-[13.5px] text-muted-foreground">{t('header.language')}</span>
            <LanguageSwitcher />
          </div>
          <button role="menuitem" type="button" className={clsx(itemClass, 'text-danger hover:bg-danger/10 hover:text-danger')} onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" aria-hidden /> {t('actions.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
