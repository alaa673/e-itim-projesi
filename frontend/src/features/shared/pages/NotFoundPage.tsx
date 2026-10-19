import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import { buttonClass } from '@/components/ui/buttonStyles';
import { ROLE_HOME } from '@/config/roles';

export function NotFoundPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-primary-solid to-primary-solid-2 text-primary-foreground shadow-[0_14px_28px_-12px_rgb(var(--primary-solid)/0.8)]">
        <Compass className="h-7 w-7" aria-hidden />
      </span>
      <p className="bg-gradient-to-r from-primary-solid to-accent bg-clip-text font-display text-[64px] font-semibold leading-none tracking-[-0.03em] text-transparent">404</p>
      <h1 className="mt-3 text-[22px] font-semibold">{t('notFound.title')}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t('notFound.body')}</p>
      <Link
        to={user ? ROLE_HOME[user.role] : '/login'}
        className={buttonClass('primary', 'md', 'mt-6')}
      >
        {t('actions.goHome')}
      </Link>
    </div>
  );
}
