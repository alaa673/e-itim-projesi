/**
 * Domain types shared by the three roles (provisional contracts — see docs/BACKEND_API_REQUIREMENTS.md).
 * Content fields (names, titles, texts) are stored in the language they were written in.
 */
import type { Difficulty } from './domain.types';
import type { SchoolLevel } from './common.types';

export type ExamType = 'LGS' | 'TYT' | 'AYT';
export type ScoreType = 'SAY' | 'EA' | 'SÖZ' | 'DİL';
export type AccountStatus = 'active' | 'inactive';

/* ── Academic structure ─────────────────────────────────────────────── */

export interface CatalogTopic {
  id: string;
  name: string;
}

export interface CatalogUnit {
  id: string;
  name: string;
  topics: CatalogTopic[];
}

export interface Subject {
  id: string;
  name: string;
  levels: SchoolLevel[];
  grades: number[];
  weeklyHours: number;
  units: CatalogUnit[];
  status: 'active' | 'archived';
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  branch: string;
  classIds: string[];
  status: AccountStatus;
  joinedAt: string;
}

export interface Term {
  id: string;
  year: string;
  name: string;
  start: string;
  end: string;
  status: 'current' | 'upcoming' | 'archived';
}

export interface SchoolClass {
  id: string;
  name: string;
  level: SchoolLevel;
  grade: number;
  section: string;
  homeroomTeacherId: string | null;
  homeroomTeacher: string | null;
  studentCount: number;
  capacity: number;
  room: string;
  status: 'active' | 'archived';
}

export interface TeacherAssignment {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string | null;
  teacherName: string | null;
  weeklyHours: number;
  status: 'assigned' | 'pending';
}

/* ── Exam archive ───────────────────────────────────────────────────── */

export type ProcessingState = 'waiting' | 'running' | 'review' | 'done' | 'failed';

export interface ArchiveFile {
  id: string;
  fileName: string;
  examType: ExamType;
  year: number;
  kind: 'questions' | 'answerKey';
  sizeBytes: number;
  pages: number;
  uploadedAt: string;
  uploadedBy: string;
  status: ProcessingState;
  progress: number;
  questionCount: number | null;
  error: string | null;
  /** Link to the original PDF. */
  fileUrl?: string | null;
}

export interface ReviewQuestion {
  id: string;
  fileId: string;
  fileName: string;
  number: number;
  examType: ExamType;
  year: number;
  stem: string;
  options: string[];
  answer: string;
  subject: string;
  topic: string;
  /** Extraction confidence 0–100 reported by the server. */
  confidence: number;
  hasFigure: boolean;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ArchiveQuestion {
  id: string;
  examType: ExamType;
  year: number;
  number: number;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  stem: string;
  options: string[];
  answer: string;
  usedCount: number;
  duplicateOf: string | null;
  status: 'active' | 'archived';
}

/* ── Guidance data ──────────────────────────────────────────────────── */

export interface HighSchool {
  id: string;
  name: string;
  city: string;
  district: string;
  type: string;
  language: string;
  quota: number;
  scores: { year: number; baseScore: number; percentile: number }[];
}

export interface UniversityProgram {
  id: string;
  university: string;
  program: string;
  faculty: string;
  city: string;
  kind: 'Devlet' | 'Vakıf';
  scoreType: ScoreType;
  baseRank: number;
  baseScore: number;
  quota: number;
  conditions: string | null;
}

export interface Career {
  id: string;
  name: string;
  field: string;
  description: string;
  skills: string[];
  programs: string[];
  outlook: 'high' | 'medium' | 'low';
  scoreType: ScoreType;
}

export interface DataSource {
  id: string;
  dataset: 'schools' | 'universities' | 'careers';
  source: string;
  year: number;
  records: number;
  updatedAt: string;
  updatedBy: string;
  status: 'current' | 'outdated' | 'importing';
}

/* ── Communication ──────────────────────────────────────────────────── */

export type Audience = 'all' | 'teachers' | 'students' | 'primary' | 'middle' | 'high' | string;

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  audienceLabel: string;
  author: string;
  authorRole: 'admin' | 'teacher';
  publishedAt: string;
  status: 'published' | 'scheduled' | 'draft';
  pinned: boolean;
}

export interface SupportMessage {
  id: string;
  from: string;
  fromRole: 'admin' | 'teacher' | 'student';
  text: string;
  at: string;
}

export interface SupportRequest {
  id: string;
  subject: string;
  category: 'account' | 'file' | 'exam' | 'content' | 'other';
  requester: string;
  requesterRole: 'teacher' | 'student';
  priority: 'low' | 'normal' | 'urgent';
  status: 'open' | 'inProgress' | 'resolved';
  createdAt: string;
  messages: SupportMessage[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  kind: 'exam' | 'homework' | 'activity' | 'meeting' | 'lesson' | 'other';
  start: string;
  end: string;
  classLabel: string | null;
  description?: string;
  /** Set by the server when the current user created the event and may delete it. */
  editable?: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  start: string;
  end: string;
  organizer: string;
  participants: string[];
  link: string;
  agenda: string;
  status: 'scheduled' | 'done' | 'cancelled';
}

export interface ChatMessage {
  id: string;
  mine: boolean;
  text: string;
  at: string;
}

export interface Conversation {
  id: string;
  name: string;
  subtitle: string;
  unread: number;
  updatedAt: string;
  messages: ChatMessage[];
}

/* ── Reports & settings ─────────────────────────────────────────────── */

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: 'admin' | 'teacher' | 'system';
  action: string;
  target: string;
  ip: string;
}
