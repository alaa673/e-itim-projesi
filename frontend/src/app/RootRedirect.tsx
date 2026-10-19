import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/Spinner';
import { ROLE_HOME } from '@/config/roles';
import { useAuth } from './providers/authContext';

export function RootRedirect() {
  const { t } = useTranslation();
  const { status, user } = useAuth();
  if (status === 'restoring') return <LoadingSpinner label={t('states.loading')} />;
  return <Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />;
}
