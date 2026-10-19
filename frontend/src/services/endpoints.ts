/**
 * PROVISIONAL endpoint map — NOT confirmed by the backend team.
 * See docs/BACKEND_API_REQUIREMENTS.md for request/response shapes to confirm.
 */
export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  admin: {
    dashboard: '/admin/dashboard',
    students: '/admin/students',
    student: (id: string) => `/admin/students/${encodeURIComponent(id)}`,
    archiveStudent: (id: string) => `/admin/students/${encodeURIComponent(id)}/archive`,
  },
  teacher: {
    dashboard: '/teacher/dashboard',
    exams: '/teacher/exams',
    examResults: (examId: string) => `/teacher/exams/${encodeURIComponent(examId)}/results`,
    supportExercises: '/teacher/support-exercises',
  },
  student: {
    dashboard: '/student/dashboard',
    progress: '/student/progress',
  },
  notifications: '/notifications',
} as const;
