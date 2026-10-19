import type { RecordStatus, SchoolLevel } from './common.types';

export interface Student {
  id: string;
  schoolNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  level: SchoolLevel;
  grade: number;
  section: string;
  status: RecordStatus;
  enrolledAt: string; // ISO date
}

export interface StudentInput {
  schoolNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  level: SchoolLevel;
  grade: number;
  section: string;
  status: Exclude<RecordStatus, 'archived'>;
}

export type StudentSortKey = 'name' | 'schoolNumber' | 'grade' | 'enrolledAt';

export interface StudentListFilters {
  search: string;
  level: SchoolLevel | '';
  grade: string;
  status: RecordStatus | '';
  sortKey: StudentSortKey;
  sortDirection: 'asc' | 'desc';
}

export interface Topic {
  id: string;
  name: string;
}

export interface TopicScore {
  topicId: string;
  /** 0–100 */
  percent: number;
  correct: number;
  total: number;
}

export interface ExamResult {
  studentId: string;
  studentName: string;
  schoolNumber: string;
  completed: boolean;
  score: number | null;
  correct: number;
  wrong: number;
  blank: number;
  topics: TopicScore[];
}

export interface ExamSummary {
  id: string;
  title: string;
  classId: string;
  className: string;
  subject: string;
  date: string;
  questionCount: number;
  topics: Topic[];
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SupportExerciseRequest {
  studentId: string;
  topicId: string;
  difficulty: Difficulty;
  questionCount: number;
  dueDate: string | null;
  includeSummary: boolean;
  /** Optional display context; the backend resolves names from the ids. */
  studentName?: string;
  className?: string;
  topicName?: string;
  percent?: number | null;
}

export interface NotificationItem {
  id: string;
  kind: 'exam' | 'assignment' | 'result' | 'system' | 'meeting';
  /** Either a frontend message key (`notifications.*`, filled with `params`)… */
  titleKey?: string;
  params?: Record<string, string | number>;
  /** …or ready-to-show text in the user's language (used when `titleKey` is missing or unknown). */
  title?: string;
  /** In-app path to open, e.g. "/student/exams?open=ex-12". */
  link?: string | null;
  createdAt: string;
  read: boolean;
}
