import type { Difficulty } from '@/types';

export interface ProgressPoint {
  id: string;
  label: string;
  date: string;
  score: number;
  classAverage: number;
}

export interface SubjectTopics {
  id: string;
  name: string;
  topics: { topicId: string; name: string; percent: number; previous: number | null }[];
}

export interface SupportExerciseItem {
  id: string;
  topic: string;
  subject: string;
  teacher: string;
  sentAt: string;
  questionCount: number;
  difficulty: Difficulty;
  due: string | null;
  status: 'pending' | 'completed';
  before: number;
  after: number | null;
  includesSummary: boolean;
}

export interface StudentGoal {
  id: string;
  label: string;
  done: boolean;
}

export interface StudentProgressData {
  timeline: ProgressPoint[];
  subjects: SubjectTopics[];
  supportExercises: SupportExerciseItem[];
  goals: StudentGoal[];
  mistakesCount: number;
}

/* ── Learner world (all student pages) ─────────────────────────────── */

export type CardTone = 'violet' | 'peach' | 'mint' | 'sky';

export interface StudentTopic {
  id: string;
  name: string;
  status: 'done' | 'inProgress' | 'todo';
  score: number | null;
}

export interface StudentSubject {
  id: string;
  name: string;
  teacher: string;
  tone: CardTone;
  illustration: 'math' | 'science' | null;
  headline: string;
  blurb: string;
  topicsDone: number;
  topicsTotal: number;
  units: { id: string; name: string; topics: StudentTopic[] }[];
}

export interface Material {
  id: string;
  title: string;
  kind: 'summary' | 'pdf' | 'presentation';
  subject: string;
  topic: string;
  teacher: string;
  sharedAt: string;
  sizeBytes: number | null;
  body: string;
  /** Download link for PDFs (https URL or server path); null in demo data. */
  fileUrl?: string | null;
  read: boolean;
}

export interface StudentExam {
  id: string;
  title: string;
  subject: string;
  kind: 'quiz' | 'written' | 'mock';
  date: string;
  durationMinutes: number;
  questionCount: number;
  status: 'upcoming' | 'available' | 'completed' | 'missed';
  score: number | null;
  classAverage: number | null;
}

export interface StudentHomework {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  due: string;
  description: string;
  rubric: { name: string; weight: number }[];
  status: 'todo' | 'submitted' | 'graded';
  submission: { text: string; fileName: string | null; fileUrl?: string | null; at: string } | null;
  score: number | null;
  feedback: string | null;
}

export interface StudentActivity {
  id: string;
  title: string;
  subject: string;
  kind: 'individual' | 'group';
  date: string;
  instructions: string;
  status: 'upcoming' | 'joined' | 'completed';
}

export interface ResultEntry {
  id: string;
  title: string;
  subject: string;
  kind: 'exam' | 'homework' | 'mock';
  date: string;
  score: number;
  classAverage: number;
  feedback: string | null;
}

export interface MistakeEntry {
  id: string;
  subject: string;
  topic: string;
  stem: string;
  options: string[];
  answer: number;
  yourAnswer: number | null;
  explanation: string;
  savedAt: string;
  learned: boolean;
}

export interface MockAttempt {
  id: string;
  examType: 'LGS' | 'TYT' | 'AYT';
  title: string;
  date: string;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
  score: number;
  bySubject: { subject: string; net: number; total: number }[];
}

export interface AvailableMock {
  id: string;
  examType: 'LGS' | 'TYT' | 'AYT';
  title: string;
  questionCount: number;
  durationMinutes: number;
  subjects: string[];
  assignedBy: string | null;
  due: string | null;
}

export interface InterestProfile {
  interests: string[];
  skills: { key: string; level: number }[];
  updatedAt: string | null;
}

/** Rule-based match between the student's interest profile and a programme (not an AI prediction). */
export interface MajorSuggestion {
  id: string;
  name: string;
  field: string;
  /** 0–100 */
  match: number;
  /** Interest / skill keys (see InterestsPage INTERESTS & SKILLS) that produced the match. */
  reasons: { kind: 'interest' | 'skill'; key: string }[];
  careers: string[];
  scoreType: 'SAY' | 'EA' | 'SÖZ' | 'DİL';
  /** Number of programmes with this name in the guidance catalogue. */
  programCount: number;
}

export interface RoadmapStep {
  id: string;
  phase: 'now' | 'thisYear' | 'university' | 'career';
  title: string;
  description: string;
  done: boolean;
}

export interface SavedChoice {
  id: string;
  kind: 'school' | 'program';
  refId: string;
  name: string;
  detail: string;
  score: number | null;
  rank: number | null;
  order: number;
  note: string;
}

/** One row of "Bugünün planı". The UI formats the chip from questionCount (exam) or at (homework due / meeting start). */
export interface PlanItem {
  id: string;
  kind: 'exam' | 'homework' | 'meeting';
  title: string;
  detail: string;
  subject: string | null;
  questionCount?: number;
  at: string;
}

export interface StudentHomeData {
  firstName: string;
  courses: StudentSubject[];
  plan: PlanItem[];
  examPrep: 'LGS' | 'TYT' | null;
  support: SupportExerciseItem | null;
  weeklyGoal: { done: number; target: number };
}
