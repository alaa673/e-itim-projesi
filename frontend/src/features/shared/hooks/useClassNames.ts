import { useMemo } from 'react';
import { lookupApi } from '@/features/admin/services/adminApi';
import { useTeachingScope } from '@/features/teacher/hooks/useTeachingScope';
import { useAsync } from '@/hooks/useAsync';
import type { UserRole } from '@/types';

/** Class names a user may address: all active classes for an administrator, own classes for a teacher. */
export function useClassNames(role: UserRole): string[] {
  const scope = useTeachingScope({ enabled: role === 'teacher' });
  const adminClasses = useAsync((signal) => (role === 'admin' ? lookupApi.classes(signal) : Promise.resolve(null)), [role]);
  return useMemo(() => {
    if (role === 'teacher') return scope.classNames;
    if (role === 'admin') return (adminClasses.data ?? []).map((c) => c.name).sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }));
    return [];
  }, [role, scope.classNames, adminClasses.data]);
}
