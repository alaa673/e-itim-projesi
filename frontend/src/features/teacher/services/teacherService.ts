import { IS_MOCK_MODE } from '@/config/constants';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import type { ExamResult, ExamSummary, Locale, PaginatedResponse, PaginationParams, SupportExerciseRequest } from '@/types';
import type { ExamAnalysis, ResultListFilters, TeacherDashboardData } from '../types';

/** Demo handlers are loaded on demand, so a real build never contains demo data. */
const mock = () => import('@/mocks/handlers/teacherHandlers');

/**
 * Teacher data. The backend must only return classes/exams assigned to the signed-in teacher.
 * Provisional contract — see docs/BACKEND_API_REQUIREMENTS.md
 */
export const teacherService = {
  getDashboard(locale: Locale, signal?: AbortSignal): Promise<TeacherDashboardData> {
    if (IS_MOCK_MODE) return mock().then((m) => m.getTeacherDashboardMock(locale, signal));
    return api.get<TeacherDashboardData>(ENDPOINTS.teacher.dashboard, { signal, query: { lang: locale } });
  },

  listExams(locale: Locale, signal?: AbortSignal): Promise<ExamSummary[]> {
    if (IS_MOCK_MODE) return mock().then((m) => m.listTeacherExamsMock(locale, signal));
    return api.get<ExamSummary[]>(ENDPOINTS.teacher.exams, { signal, query: { lang: locale, status: 'graded' } });
  },

  getExamAnalysis(examId: string, locale: Locale, signal?: AbortSignal): Promise<ExamAnalysis> {
    if (IS_MOCK_MODE) return mock().then((m) => m.getExamAnalysisMock(examId, locale, signal));
    return api.get<ExamAnalysis>(`${ENDPOINTS.teacher.examResults(examId)}/summary`, { signal, query: { lang: locale } });
  },

  listExamResults(
    examId: string,
    filters: ResultListFilters,
    page: PaginationParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<ExamResult>> {
    if (IS_MOCK_MODE) return mock().then((m) => m.listExamResultsMock(examId, filters, page, signal));
    return api.get<PaginatedResponse<ExamResult>>(ENDPOINTS.teacher.examResults(examId), {
      signal,
      query: {
        offset: page.offset,
        limit: page.limit,
        search: filters.search.trim(),
        weakTopic: filters.weakTopicId,
        sort: filters.sortKey,
        order: filters.sortDirection,
      },
    });
  },

  sendSupportExercise(request: SupportExerciseRequest): Promise<{ id: string }> {
    if (IS_MOCK_MODE) return mock().then((m) => m.sendSupportExerciseMock(request));
    return api.post<{ id: string }>(ENDPOINTS.teacher.supportExercises, request);
  },
};
