import type { Difficulty, ExamResult, ExamSummary, ExamType } from '@/types';

export interface TeacherClassCard {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
  /** Average of the most recent exam, 0–100. */
  average: number;
}

export interface StudentNeedingSupport {
  studentId: string;
  studentName: string;
  className: string;
  examId: string;
  topicId: string;
  topicName: string;
  percent: number;
}

export interface TeacherScheduleItem {
  id: string;
  start: string;
  end: string;
  classLabel: string | null;
  title: string;
  kind: 'lesson' | 'exam' | 'meeting' | 'homework' | 'activity' | 'other';
}

export interface TeacherDashboardData {
  stats: { classes: number; students: number; activeExams: number; pendingReviews: number };
  needsSupport: StudentNeedingSupport[];
  schedule: TeacherScheduleItem[];
  classes: TeacherClassCard[];
  latestExam: { id: string; title: string; className: string; completed: number; assigned: number; average: number; questionCount: number; date: string } | null;
}

export interface TopicAverage {
  topicId: string;
  name: string;
  percent: number;
  /** Students scoring under the review threshold in this topic. */
  belowThreshold: number;
}

export interface ExamAnalysis {
  exam: ExamSummary;
  assigned: number;
  completed: number;
  average: number;
  highest: number;
  lowest: number;
  topicAverages: TopicAverage[];
  notCompleted: { studentId: string; studentName: string }[];
}

export type ResultSortKey = 'score' | 'name';

export interface ResultListFilters {
  search: string;
  sortKey: ResultSortKey;
  sortDirection: 'asc' | 'desc';
  /** Only show students below the threshold in this topic. */
  weakTopicId: string;
}

export type { ExamResult };

/* ── Contract types (shared by the API services and the demo data) ── */

/** What the signed-in teacher teaches: drives every class and topic picker on the teacher pages. */
export interface TeachingScope {
  classes: { name: string; grade: number; subject: string; studentCount: number }[];
  /** Topic names for each class (the teacher's subject at that grade), in curriculum order. */
  topicsByClass: Record<string, string[]>;
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  topic: string;
  classNames: string[];
  fileName: string | null;
  /** Stored PDF (returned by the summary upload); the server derives fileUrl from it. */
  fileId?: string | null;
  fileUrl?: string | null;
  summary: string;
  status: 'draft' | 'shared';
  updatedAt: string;
  views: number;
}

export interface BankQuestion {
  id: string;
  stem: string;
  options: string[];
  answer: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  source: 'manual' | 'generated' | 'archive';
  status: 'draft' | 'approved';
  createdAt: string;
  usedIn: number;
}

export interface Slide {
  title: string;
  bullets: string[];
}

export interface Presentation {
  id: string;
  title: string;
  topic: string;
  className: string;
  slides: Slide[];
  status: 'draft' | 'ready';
  updatedAt: string;
}

export interface ClassExam {
  id: string;
  title: string;
  classNames: string[];
  date: string;
  durationMinutes: number;
  questionIds: string[];
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  completed: number;
  assigned: number;
  average: number | null;
}

export interface MockExam {
  id: string;
  examType: ExamType;
  title: string;
  distribution: { subject: string; count: number }[];
  classNames: string[];
  date: string;
  durationMinutes: number;
  status: 'draft' | 'scheduled' | 'completed';
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  classNames: string[];
  due: string;
  rubricId: string | null;
  submitted: number;
  total: number;
  status: 'open' | 'closed';
}

export interface Activity {
  id: string;
  title: string;
  kind: 'individual' | 'group';
  description: string;
  classNames: string[];
  date: string;
  participants: number;
  status: 'planned' | 'done';
}

export interface RubricLevel {
  label: string;
  points: number;
  description: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  weight: number;
  levels: RubricLevel[];
}

export interface Rubric {
  id: string;
  title: string;
  description: string;
  criteria: RubricCriterion[];
  usedIn: number;
  updatedAt: string;
}

export interface Submission {
  id: string;
  homeworkId: string;
  homeworkTitle: string;
  studentName: string;
  className: string;
  submittedAt: string;
  text: string;
  attachment: string | null;
  /** Download link of the uploaded file (https URL or server path). */
  attachmentUrl?: string | null;
  /** Score suggested from the rubric/auto-check; the teacher always confirms. */
  suggestedScore: number;
  score: number | null;
  feedback: string;
  status: 'pending' | 'graded';
}

export interface Appeal {
  id: string;
  kind: 'score' | 'question';
  studentName: string;
  className: string;
  exam: string;
  questionNo: number | null;
  message: string;
  createdAt: string;
  status: 'open' | 'accepted' | 'rejected';
  response: string;
}

export interface SentSupport {
  id: string;
  studentName: string;
  className: string;
  topic: string;
  difficulty: Difficulty;
  questionCount: number;
  includeSummary: boolean;
  sentAt: string;
  due: string | null;
  status: 'pending' | 'completed';
  before: number;
  after: number | null;
}

export interface StudyGroup {
  id: string;
  name: string;
  className: string;
  topic: string;
  members: string[];
  createdAt: string;
  note: string;
}

export interface TopicPercent {
  name: string;
  percent: number;
}

export interface TeacherStudentRow {
  id: string;
  name: string;
  className: string;
  schoolNumber: string;
  average: number;
  lastScore: number | null;
  /** Change vs the previous exam, in points. */
  trend: number;
  weakTopic: TopicPercent | null;
  topics: TopicPercent[];
  recent: { title: string; date: string; score: number }[];
  support: 'none' | 'pending' | 'completed';
}

export interface TeacherClassRow {
  id: string;
  name: string;
  grade: number;
  subject: string;
  studentCount: number;
  average: number;
  lastExam: { id: string; title: string; date: string; average: number } | null;
  topics: TopicPercent[];
  needsSupport: number;
}
