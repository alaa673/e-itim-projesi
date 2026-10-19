import { type ComponentType, lazy, type LazyExoticComponent, Suspense } from 'react';
import { createBrowserRouter, createHashRouter, createMemoryRouter, Navigate, Outlet, type RouteObject } from 'react-router-dom';
import { ROUTER_MODE } from '@/config/constants';
import { ACCOUNT_PAGES, flattenNavigation } from '@/config/navigation';
import { ROLE_HOME, ROLE_PREFIX, ROLES } from '@/config/roles';
import { PageSkeleton } from '@/components/ui/States';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { NotFoundPage } from '@/features/shared/pages/NotFoundPage';
import { RouteErrorPage } from '@/features/shared/pages/RouteErrorPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { UserRole } from '@/types';
import { LevelGate } from './guards/LevelGate';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { RoleGuard } from './guards/RoleGuard';
import { RootRedirect } from './RootRedirect';

type LazyPage = LazyExoticComponent<ComponentType>;

/** Pages lazy-loaded per role (id = navigation id). router.test.ts checks that every menu entry has one. */
const shared = {
  announcements: (role: UserRole) => lazy(() => import('@/features/shared/pages/AnnouncementsPage').then((m) => ({ default: () => <m.default role={role} /> }))),
  calendar: (role: UserRole) => lazy(() => import('@/features/shared/pages/CalendarPage').then((m) => ({ default: () => <m.default role={role} /> }))),
  meetings: (role: UserRole) => lazy(() => import('@/features/shared/pages/MeetingsPage').then((m) => ({ default: () => <m.default role={role} /> }))),
  messages: (role: UserRole) => lazy(() => import('@/features/shared/pages/MessagesPage').then((m) => ({ default: () => <m.default role={role} /> }))),
};

export const PAGES: Record<UserRole, Record<string, LazyPage>> = {
  admin: {
    home: lazy(() => import('@/features/admin/pages/AdminDashboardPage')),
    teachers: lazy(() => import('@/features/admin/pages/TeachersPage')),
    students: lazy(() => import('@/features/admin/pages/StudentsPage')),
    import: lazy(() => import('@/features/admin/pages/ImportPage')),
    terms: lazy(() => import('@/features/admin/pages/TermsPage')),
    classes: lazy(() => import('@/features/admin/pages/ClassesPage')),
    subjects: lazy(() => import('@/features/admin/pages/SubjectsPage')),
    assignments: lazy(() => import('@/features/admin/pages/AssignmentsPage')),
    pdfUpload: lazy(() => import('@/features/admin/pages/PdfUploadPage')),
    questionReview: lazy(() => import('@/features/admin/pages/QuestionReviewPage')),
    approvedQuestions: lazy(() => import('@/features/admin/pages/ApprovedQuestionsPage')),
    processing: lazy(() => import('@/features/admin/pages/ProcessingPage')),
    schools: lazy(() => import('@/features/admin/pages/SchoolsPage')),
    universities: lazy(() => import('@/features/admin/pages/UniversitiesPage')),
    careers: lazy(() => import('@/features/admin/pages/CareersPage')),
    dataUpdates: lazy(() => import('@/features/admin/pages/DataUpdatesPage')),
    announcements: shared.announcements('admin'),
    supportRequests: lazy(() => import('@/features/admin/pages/SupportRequestsPage')),
    platformUsage: lazy(() => import('@/features/admin/pages/PlatformUsagePage')),
    aiUsage: lazy(() => import('@/features/admin/pages/AiUsagePage')),
    auditLog: lazy(() => import('@/features/admin/pages/AuditLogPage')),
    institution: lazy(() => import('@/features/admin/pages/InstitutionPage')),
    permissions: lazy(() => import('@/features/admin/pages/PermissionsPage')),
    aiSettings: lazy(() => import('@/features/admin/pages/AiSettingsPage')),
    integrations: lazy(() => import('@/features/admin/pages/IntegrationsPage')),
    retention: lazy(() => import('@/features/admin/pages/RetentionPage')),
  },
  teacher: {
    home: lazy(() => import('@/features/teacher/pages/TeacherDashboardPage')),
    myClasses: lazy(() => import('@/features/teacher/pages/MyClassesPage')),
    myStudents: lazy(() => import('@/features/teacher/pages/MyStudentsPage')),
    studyGroups: lazy(() => import('@/features/teacher/pages/StudyGroupsPage')),
    lessons: lazy(() => import('@/features/teacher/pages/LessonsPage')),
    questionBank: lazy(() => import('@/features/teacher/pages/QuestionBankPage')),
    presentations: lazy(() => import('@/features/teacher/pages/PresentationsPage')),
    classExams: lazy(() => import('@/features/teacher/pages/ClassExamsPage')),
    mockExams: lazy(() => import('@/features/teacher/pages/MockExamsPage')),
    assignments: lazy(() => import('@/features/teacher/pages/HomeworkPage')),
    activities: lazy(() => import('@/features/teacher/pages/ActivitiesPage')),
    rubrics: lazy(() => import('@/features/teacher/pages/RubricsPage')),
    grading: lazy(() => import('@/features/teacher/pages/GradingPage')),
    appeals: lazy(() => import('@/features/teacher/pages/AppealsPage')),
    resultsAnalysis: lazy(() => import('@/features/teacher/pages/ResultsAnalysisPage')),
    individualSupport: lazy(() => import('@/features/teacher/pages/IndividualSupportPage')),
    reports: lazy(() => import('@/features/teacher/pages/ReportsPage')),
    calendar: shared.calendar('teacher'),
    meetings: shared.meetings('teacher'),
    messages: shared.messages('teacher'),
    announcements: shared.announcements('teacher'),
  },
  student: {
    home: lazy(() => import('@/features/student/pages/StudentDashboardPage')),
    subjects: lazy(() => import('@/features/student/pages/SubjectsPage')),
    materials: lazy(() => import('@/features/student/pages/MaterialsPage')),
    exams: lazy(() => import('@/features/student/pages/StudentExamsPage')),
    assignments: lazy(() => import('@/features/student/pages/StudentHomeworkPage')),
    activities: lazy(() => import('@/features/student/pages/StudentActivitiesPage')),
    results: lazy(() => import('@/features/student/pages/ResultsPage')),
    topicAnalysis: lazy(() => import('@/features/student/pages/ProgressPage')),
    supportWork: lazy(() => import('@/features/student/pages/SupportWorkPage')),
    mistakes: lazy(() => import('@/features/student/pages/MistakesPage')),
    goals: lazy(() => import('@/features/student/pages/GoalsPage')),
    topicPractice: lazy(() => import('@/features/student/pages/TopicPracticePage')),
    mockExams: lazy(() => import('@/features/student/pages/StudentMockExamsPage')),
    mockHistory: lazy(() => import('@/features/student/pages/MockHistoryPage')),
    interests: lazy(() => import('@/features/student/pages/InterestsPage')),
    preferenceAssistant: lazy(() => import('@/features/student/pages/PreferenceAssistantPage')),
    majors: lazy(() => import('@/features/student/pages/MajorsPage')),
    careers: lazy(() => import('@/features/student/pages/StudentCareersPage')),
    roadmap: lazy(() => import('@/features/student/pages/RoadmapPage')),
    savedList: lazy(() => import('@/features/student/pages/SavedListPage')),
    calendar: shared.calendar('student'),
    meetings: shared.meetings('student'),
    messages: shared.messages('student'),
    announcements: shared.announcements('student'),
  },
};

/** Account pages shared by all roles. */
export const ACCOUNT_PAGE_COMPONENTS: Record<string, LazyPage> = {
  profile: lazy(() => import('@/features/account/pages/ProfilePage')),
  accountSettings: lazy(() => import('@/features/account/pages/AccountSettingsPage')),
  help: lazy(() => import('@/features/account/pages/HelpPage')),
};


function roleRoutes(role: UserRole): RouteObject {
  const navRoutes: RouteObject[] = flattenNavigation(role).map((entry) => {
    const Page = PAGES[role][entry.id];
    return {
      path: entry.path,
      element: Page ? (
        <LevelGate levels={entry.levels}>
          <Page />
        </LevelGate>
      ) : (
        <NotFoundPage />
      ),
    };
  });
  const accountRoutes: RouteObject[] = ACCOUNT_PAGES.map((page) => {
    const Page = ACCOUNT_PAGE_COMPONENTS[page.id];
    return {
      path: `${ROLE_PREFIX[role]}/${page.slug}`,
      element: Page ? <Page /> : <NotFoundPage />,
    };
  });

  return {
    path: ROLE_PREFIX[role],
    // Page crashes stay inside the app shell (sidebar and header keep working).
    errorElement: <RouteErrorPage />,
    element: (
      <RoleGuard role={role}>
        <Outlet />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <Navigate to={ROLE_HOME[role]} replace /> },
      ...navRoutes,
      ...accountRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  };
}

const ChangePasswordPage = lazy(() => import('@/features/account/pages/ChangePasswordPage'));

export const routes: RouteObject[] = [
  {
    // Last line of defence for errors outside the dashboard (sign-in, password change, layout).
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <RootRedirect /> },
      { path: '/login', element: <LoginPage /> },
      {
        path: '/change-password',
        element: (
          <ProtectedRoute allowPasswordChange>
            <Suspense fallback={<PageSkeleton />}>
              <ChangePasswordPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: ROLES.map(roleRoutes),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  if (ROUTER_MODE === 'memory') return createMemoryRouter(routes);
  if (ROUTER_MODE === 'hash') return createHashRouter(routes);
  return createBrowserRouter(routes);
}
