import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import { buttonClass } from '@/components/ui/buttonStyles';
import { ROLE_HOME } from '@/config/roles';

export function ForbiddenPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-danger/10 text-danger ring-1 ring-inset ring-danger/20">
        <ShieldAlert className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="text-[22px] font-semibold">{t('notFound.forbiddenTitle')}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t('notFound.forbiddenBody')}</p>
      {user && (
        <Link
          to={ROLE_HOME[user.role]}
          className={buttonClass('primary', 'md', 'mt-6')}
        >
          {t('actions.goHome')}
        </Link>
      )}
    </div>
  );
}
