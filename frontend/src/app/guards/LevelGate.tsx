import type { ReactNode } from 'react';
import { useAuth } from '@/app/providers/authContext';
import { NotFoundPage } from '@/features/shared/pages/NotFoundPage';
import type { SchoolLevel } from '@/types';

/**
 * Level-restricted student pages (e.g. university tools) are not reachable by URL for other levels either.
 * UX only — the server must still refuse the data for students of other levels.
 */
export function LevelGate({ levels, children }: { levels?: SchoolLevel[]; children: ReactNode }) {
  const { user } = useAuth();
  if (levels && user?.role === 'student' && user.level && !levels.includes(user.level)) return <NotFoundPage />;
  return <>{children}</>;
}
