import { IS_MOCK_MODE } from '@/config/constants';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import type { Locale } from '@/types';
import type { StudentHomeData, StudentProgressData } from '../types';

/** Demo handlers are loaded on demand, so a real build never contains demo data. */
const mock = () => import('@/mocks/handlers/studentPortalHandlers');

/** The backend must scope every response to the signed-in student only. */
export const studentPortalService = {
  getDashboard(locale: Locale, signal?: AbortSignal): Promise<StudentHomeData> {
    if (IS_MOCK_MODE) return mock().then((m) => m.getStudentDashboardMock(locale, signal));
    return api.get<StudentHomeData>(ENDPOINTS.student.dashboard, { signal, query: { lang: locale } });
  },

  getProgress(locale: Locale, signal?: AbortSignal): Promise<StudentProgressData> {
    if (IS_MOCK_MODE) return mock().then((m) => m.getStudentProgressMock(locale, signal));
    return api.get<StudentProgressData>(ENDPOINTS.student.progress, { signal, query: { lang: locale } });
  },
};
