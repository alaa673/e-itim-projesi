import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/Spinner';
import { useAuth } from '../providers/authContext';

/**
 * UX-level guard only: redirects anonymous users to /login and remembers where they wanted to go.
 * Real authorization is enforced by the backend on every request.
 */
export function ProtectedRoute({ children, allowPasswordChange = false }: { children: ReactNode; allowPasswordChange?: boolean }) {
  const { t } = useTranslation();
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'restoring') return <LoadingSpinner label={t('states.loading')} />;
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  // Accounts created or reset by an administrator must choose their own password first.
  if (user?.mustChangePassword && !allowPasswordChange) {
    return <Navigate to="/change-password" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <>{children}</>;
}
