import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Compass,
  FileArchive,
  FileText,
  GraduationCap,
  House,
  type LucideIcon,
  MessagesSquare,
  NotebookPen,
  Settings,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { SchoolLevel, UserRole } from '@/types';

/**
 * Single source of truth for role-based navigation.
 * Labels: i18n key `nav.<role>.<id>` (common namespace).
 * Each id maps to a page component in app/router.tsx; `levels` limits a student entry to some school levels
 * (enforced for the route too — and, in production, by the server).
 */
export interface NavLeaf {
  id: string;
  path: string;
  /** Restrict to student levels (e.g. hide university tools from primary-school students). */
  levels?: SchoolLevel[];
}

export interface NavGroup {
  id: string;
  icon: LucideIcon;
  /** Direct link (no children), e.g. the home page. */
  path?: string;
  children?: NavLeaf[];
  levels?: SchoolLevel[];
}

const leaf = (role: UserRole, id: string, slug: string, extra: Partial<NavLeaf> = {}): NavLeaf => ({
  id,
  path: `/${role}/${slug}`,
  ...extra,
});

export const NAVIGATION: Record<UserRole, NavGroup[]> = {
  admin: [
    { id: 'home', icon: House, path: '/admin/dashboard' },
    {
      id: 'users',
      icon: Users,
      children: [
        leaf('admin', 'teachers', 'teachers'),
        leaf('admin', 'students', 'students'),
        leaf('admin', 'import', 'import'),
      ],
    },
    {
      id: 'academic',
      icon: GraduationCap,
      children: [
        leaf('admin', 'terms', 'terms'),
        leaf('admin', 'classes', 'classes'),
        leaf('admin', 'subjects', 'subjects'),
        leaf('admin', 'assignments', 'assignments'),
      ],
    },
    {
      id: 'examArchive',
      icon: FileArchive,
      children: [
        leaf('admin', 'pdfUpload', 'exam-archive/upload'),
        leaf('admin', 'questionReview', 'exam-archive/review'),
        leaf('admin', 'approvedQuestions', 'exam-archive/approved'),
        leaf('admin', 'processing', 'exam-archive/processing'),
      ],
    },
    {
      id: 'guidanceData',
      icon: Compass,
      children: [
        leaf('admin', 'schools', 'guidance/schools'),
        leaf('admin', 'universities', 'guidance/universities'),
        leaf('admin', 'careers', 'guidance/careers'),
        leaf('admin', 'dataUpdates', 'guidance/updates'),
      ],
    },
    {
      id: 'communication',
      icon: MessagesSquare,
      children: [
        leaf('admin', 'announcements', 'announcements'),
        leaf('admin', 'supportRequests', 'support-requests'),
      ],
    },
    {
      id: 'reports',
      icon: BarChart3,
      children: [
        leaf('admin', 'platformUsage', 'reports/usage'),
        leaf('admin', 'aiUsage', 'reports/ai'),
        leaf('admin', 'auditLog', 'reports/audit'),
      ],
    },
    {
      id: 'settings',
      icon: Settings,
      children: [
        leaf('admin', 'institution', 'settings/institution'),
        leaf('admin', 'permissions', 'settings/permissions'),
        leaf('admin', 'aiSettings', 'settings/ai'),
        leaf('admin', 'integrations', 'settings/integrations'),
        leaf('admin', 'retention', 'settings/retention'),
      ],
    },
  ],

  teacher: [
    { id: 'home', icon: House, path: '/teacher/dashboard' },
    {
      id: 'classesStudents',
      icon: Users,
      children: [
        leaf('teacher', 'myClasses', 'classes'),
        leaf('teacher', 'myStudents', 'students'),
        leaf('teacher', 'studyGroups', 'groups'),
      ],
    },
    {
      id: 'content',
      icon: BookOpen,
      children: [
        leaf('teacher', 'lessons', 'lessons'),
        leaf('teacher', 'questionBank', 'questions'),
        leaf('teacher', 'presentations', 'presentations'),
      ],
    },
    {
      id: 'tasksExams',
      icon: NotebookPen,
      children: [
        leaf('teacher', 'classExams', 'exams'),
        leaf('teacher', 'mockExams', 'mock-exams'),
        leaf('teacher', 'assignments', 'assignments'),
        leaf('teacher', 'activities', 'activities'),
      ],
    },
    {
      id: 'assessment',
      icon: ClipboardCheck,
      children: [
        leaf('teacher', 'rubrics', 'rubrics'),
        leaf('teacher', 'grading', 'grading'),
        leaf('teacher', 'appeals', 'appeals'),
      ],
    },
    {
      id: 'followUp',
      icon: TrendingUp,
      children: [
        leaf('teacher', 'resultsAnalysis', 'results'),
        leaf('teacher', 'individualSupport', 'support'),
        leaf('teacher', 'reports', 'reports'),
      ],
    },
    {
      id: 'communication',
      icon: CalendarDays,
      children: [
        leaf('teacher', 'calendar', 'calendar'),
        leaf('teacher', 'meetings', 'meetings'),
        leaf('teacher', 'messages', 'messages'),
        leaf('teacher', 'announcements', 'announcements'),
      ],
    },
  ],

  student: [
    { id: 'home', icon: House, path: '/student/dashboard' },
    {
      id: 'lessons',
      icon: BookOpen,
      children: [leaf('student', 'subjects', 'lessons'), leaf('student', 'materials', 'materials')],
    },
    {
      id: 'tasks',
      icon: NotebookPen,
      children: [
        leaf('student', 'exams', 'exams'),
        leaf('student', 'assignments', 'assignments'),
        leaf('student', 'activities', 'activities'),
      ],
    },
    {
      id: 'progress',
      icon: TrendingUp,
      children: [
        leaf('student', 'results', 'results'),
        leaf('student', 'topicAnalysis', 'progress'),
        leaf('student', 'supportWork', 'support'),
        leaf('student', 'mistakes', 'mistakes'),
        leaf('student', 'goals', 'goals'),
      ],
    },
    {
      id: 'examPrep',
      icon: Target,
      levels: ['middle', 'high'],
      children: [
        leaf('student', 'topicPractice', 'practice'),
        leaf('student', 'mockExams', 'mock-exams'),
        leaf('student', 'mockHistory', 'mock-history'),
      ],
    },
    {
      id: 'guidance',
      icon: Compass,
      levels: ['middle', 'high'],
      children: [
        leaf('student', 'interests', 'guidance/interests'),
        leaf('student', 'preferenceAssistant', 'guidance/preferences'),
        leaf('student', 'majors', 'guidance/majors', { levels: ['high'] }),
        leaf('student', 'careers', 'guidance/careers', { levels: ['high'] }),
        leaf('student', 'roadmap', 'guidance/roadmap', { levels: ['high'] }),
        leaf('student', 'savedList', 'guidance/saved'),
      ],
    },
    {
      id: 'communication',
      icon: CalendarDays,
      children: [
        leaf('student', 'calendar', 'calendar'),
        leaf('student', 'meetings', 'meetings'),
        leaf('student', 'messages', 'messages'),
        leaf('student', 'announcements', 'announcements'),
      ],
    },
  ],
};

/** Account pages shared by all roles (reached from the user menu / sidebar footer). */
export const ACCOUNT_PAGES = [
  { id: 'profile', slug: 'account/profile', icon: FileText },
  { id: 'accountSettings', slug: 'account/settings', icon: Settings },
  { id: 'help', slug: 'help', icon: MessagesSquare },
] as const;

function allowedForLevel(levels: SchoolLevel[] | undefined, level: SchoolLevel | undefined): boolean {
  if (!levels || !level) return true;
  return levels.includes(level);
}

/** Navigation visible to a user; students only see sections suitable for their school level. */
export function getNavigation(role: UserRole, level?: SchoolLevel): NavGroup[] {
  return NAVIGATION[role]
    .filter((group) => allowedForLevel(group.levels, role === 'student' ? level : undefined))
    .map((group) =>
      group.children
        ? {
            ...group,
            children: group.children.filter((item) =>
              allowedForLevel(item.levels, role === 'student' ? level : undefined),
            ),
          }
        : group,
    );
}

export interface FlatNavEntry {
  id: string;
  groupId: string | null;
  path: string;
  /** Student levels allowed to open this page (undefined = all). */
  levels?: SchoolLevel[];
}

/** Flattened list used to build routes and breadcrumbs. */
export function flattenNavigation(role: UserRole): FlatNavEntry[] {
  const entries: FlatNavEntry[] = [];
  for (const group of NAVIGATION[role]) {
    if (group.path) {
      entries.push({ id: group.id, groupId: null, path: group.path, levels: group.levels });
    }
    for (const item of group.children ?? []) {
      entries.push({ id: item.id, groupId: group.id, path: item.path, levels: item.levels ?? group.levels });
    }
  }
  return entries;
}
