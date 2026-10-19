import { IS_MOCK_MODE } from '@/config/constants';
import { mockDelay } from '@/mocks/utils';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import type { SchoolLevel } from '@/types';
import type { AdminDashboardData } from '../types';

/** Demo data is loaded on demand, so a real build never contains it. */
async function mockDashboard(level: SchoolLevel | ''): Promise<AdminDashboardData> {
  const [{ archiveFiles, reviewQueue }, { assignments, classes, teachers }, { aiUsageSeries, settingsStore }, { mockStudentTable }] = await Promise.all([
    import('@/mocks/db/archive'),
    import('@/mocks/db/core'),
    import('@/mocks/db/admin'),
    import('@/mocks/mockStudents'),
  ]);
  const activeStudents = mockStudentTable.filter((s) => s.status !== 'archived');
  const files = archiveFiles.all();
  const spent = aiUsageSeries().reduce((sum, d) => sum + d.cost, 0);
  const backup = settingsStore.retention.backups.find((b) => b.status === 'success') ?? null;
  const pool = mockStudentTable.filter((s) => s.status !== 'archived' && (!level || s.level === level));
  const names = ['Deniz Kaya', 'Ece Demir', 'Mert Arslan'];
  const featured = [...pool.filter((s) => names.includes(`${s.firstName} ${s.lastName}`)), ...pool].filter((s, i, arr) => arr.indexOf(s) === i);
  return {
    termLabel: '2026–2027 Güz Dönemi',
    stats: {
      students: activeStudents.length,
      teachers: teachers.all().filter((t) => t.status === 'active').length,
      classes: classes.all().filter((c) => c.status === 'active').length,
      pendingQuestions: reviewQueue.all().filter((q) => q.status === 'pending').length,
      deltas: { students: 12, teachers: 9, classes: 6, pendingQuestions: 33 },
    },
    students: featured.slice(0, 3),
    teachers: teachers.all().filter((t) => t.status === 'active').slice(0, 3),
    levelOf: {},
    reviewFile: files.find((f) => f.status === 'review') ?? null,
    assignments: assignments.all().filter((a) => a.status === 'assigned' && ['8-A', '11-B', '9-C'].includes(a.className) && ['Matematik', 'Fizik'].includes(a.subjectName)).slice(0, 3),
    system: {
      lastBackupAt: backup?.at ?? null,
      backupOk: Boolean(backup),
      queue: {
        total: files.filter((f) => f.status === 'running' || f.status === 'waiting').length,
        running: files.filter((f) => f.status === 'running').length,
        waiting: files.filter((f) => f.status === 'waiting').length,
      },
      aiPercent: Math.round((spent / settingsStore.ai.monthlyBudget) * 100),
    },
  };
}

export const adminDashboardService = {
  get(level: SchoolLevel | '', signal?: AbortSignal): Promise<AdminDashboardData> {
    if (IS_MOCK_MODE) return mockDashboard(level).then((data) => mockDelay(() => data, signal));
    return api.get<AdminDashboardData>(ENDPOINTS.admin.dashboard, { signal, query: { level } });
  },
};
