import type { ReactNode } from 'react';
import { useAuth } from '../providers/authContext';
import type { UserRole } from '@/types';
import { ForbiddenPage } from '@/features/shared/pages/ForbiddenPage';

/** Shows a "no access" page when a user opens another role's section. Backend still decides access. */
export function RoleGuard({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role !== role) return <ForbiddenPage />;
  return <>{children}</>;
}
