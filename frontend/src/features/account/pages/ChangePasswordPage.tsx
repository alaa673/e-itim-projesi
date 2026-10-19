import { KeyRound, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import { PusulaLogo } from '@/components/brand/PusulaLogo';
import { LanguageMenu } from '@/components/layout/LanguageMenu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { ROLE_HOME, ROLE_PREFIX } from '@/config/roles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PasswordForm } from '../components/PasswordForm';

/**
 * Shown right after sign-in when the server marks the account with `mustChangePassword`
 * (new accounts and passwords reset by the administrator). Nothing else opens until it is done.
 */
export default function ChangePasswordPage() {
  const { t } = useTranslation(['account', 'common']);
  const { user, logout, passwordChanged } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useDocumentTitle(t('firstLogin.title'));
  if (!user) return null;
  const from = (location.state as { from?: string } | null)?.from;
  const destination = from && from.startsWith(ROLE_PREFIX[user.role]) ? from : ROLE_HOME[user.role];
  if (!user.mustChangePassword) return <Navigate to={destination} replace />;

  return (
    <div data-role={user.role} className="flex min-h-full flex-col bg-background px-5 pb-10 sm:px-10">
      <div className="flex items-center justify-between gap-2 pt-5">
        <PusulaLogo size="sm" tone="dark" />
        <div className="flex items-center gap-2">
          <ThemeToggle className="h-11 w-11 rounded-[14px]" />
          <LanguageMenu />
        </div>
      </div>
      <main className="flex flex-1 items-center justify-center py-8">
        <div className="panel w-full max-w-[520px] p-6 sm:p-8">
          <span className="icon-tile h-12 w-12 bg-accent-soft text-accent-ink">
            <KeyRound className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-[28px] font-extrabold leading-tight text-foreground">{t('firstLogin.title')}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">{t('firstLogin.lead', { name: user.firstName })}</p>
          <div className="mt-6">
            <PasswordForm
              fullWidthSubmit
              onDone={() => {
                passwordChanged();
                navigate(destination, { replace: true });
              }}
            />
          </div>
          <Button
            variant="ghost"
            className="mt-4 w-full"
            icon={<LogOut className="h-4 w-4" aria-hidden />}
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
          >
            {t('actions.signOut', { ns: 'common' })}
          </Button>
        </div>
      </main>
    </div>
  );
}
