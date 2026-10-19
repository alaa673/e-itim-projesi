import { IS_MOCK_MODE } from '@/config/constants';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import type { PaginatedResponse, PaginationParams, Student, StudentInput, StudentListFilters } from '@/types';

/** Demo handlers are loaded on demand, so a real build never contains demo data. */
const mock = () => import('@/mocks/handlers/studentHandlers');

/** Student management (admin). Provisional contract — see docs/BACKEND_API_REQUIREMENTS.md */
export const studentService = {
  list(filters: StudentListFilters, page: PaginationParams, signal?: AbortSignal): Promise<PaginatedResponse<Student>> {
    if (IS_MOCK_MODE) return mock().then((m) => m.listStudentsMock(filters, page, signal));
    return api.get<PaginatedResponse<Student>>(ENDPOINTS.admin.students, {
      signal,
      query: {
        offset: page.offset,
        limit: page.limit,
        search: filters.search.trim(),
        level: filters.level,
        grade: filters.grade,
        status: filters.status,
        sort: filters.sortKey,
        order: filters.sortDirection,
      },
    });
  },

  create(input: StudentInput): Promise<Student> {
    if (IS_MOCK_MODE) return mock().then((m) => m.createStudentMock(input));
    return api.post<Student>(ENDPOINTS.admin.students, input);
  },

  update(id: string, input: StudentInput): Promise<Student> {
    if (IS_MOCK_MODE) return mock().then((m) => m.updateStudentMock(id, input));
    return api.patch<Student>(ENDPOINTS.admin.student(id), input);
  },

  /** Archive instead of delete: keeps the student's past results. */
  archive(id: string): Promise<Student> {
    if (IS_MOCK_MODE) return mock().then((m) => m.archiveStudentMock(id));
    return api.post<Student>(ENDPOINTS.admin.archiveStudent(id));
  },
};
