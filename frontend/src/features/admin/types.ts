import type { ArchiveFile, SchoolLevel, Student, Teacher, TeacherAssignment } from '@/types';

export interface Delta {
  /** Change vs last month, in percent (can be negative). */
  percent: number;
}

export interface AdminDashboardData {
  termLabel: string;
  stats: {
    students: number;
    teachers: number;
    classes: number;
    pendingQuestions: number;
    deltas: { students: number; teachers: number; classes: number; pendingQuestions: number };
  };
  students: Student[];
  teachers: Teacher[];
  levelOf: Record<string, SchoolLevel>;
  reviewFile: ArchiveFile | null;
  assignments: TeacherAssignment[];
  system: {
    lastBackupAt: string | null;
    backupOk: boolean;
    queue: { total: number; running: number; waiting: number };
    aiPercent: number;
  };
}

/* ── Contract types (shared by the API services and the demo data) ── */

export interface WeeklyUsage {
  week: string;
  activeStudents: number;
  activeTeachers: number;
  examsTaken: number;
  filesUploaded: number;
}

export interface AiUsageDay {
  date: string;
  operations: number;
  cost: number;
}

export interface InstitutionSettings {
  name: string;
  shortName: string;
  type: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  defaultLanguage: 'tr' | 'en';
  lessonMinutes: number;
  gradingScale: '100' | '5';
  logoDataUrl: string | null;
}

export interface PermissionRule {
  key: string;
  group: 'users' | 'content' | 'exams' | 'reports' | 'communication';
  admin: boolean;
  teacher: boolean;
  student: boolean;
  /** Locked rules are enforced by the system and cannot be changed here. */
  locked: boolean;
}

export interface AiSettings {
  provider: 'openai' | 'anthropic' | 'google' | 'azure';
  model: string;
  keyStatus: 'configured' | 'missing';
  keyHint: string | null;
  monthlyBudget: number;
  teacherDailyLimit: number;
  studentDailyLimit: number;
  features: Record<'pdfExtraction' | 'summaries' | 'questionGeneration' | 'presentations' | 'guidance', boolean>;
  lastTestAt: string | null;
}

export interface IntegrationSettings {
  meetingProvider: 'jitsi' | 'meet' | 'teams' | 'zoom';
  meetingBaseUrl: string;
  emailEnabled: boolean;
  senderAddress: string;
  smtpStatus: 'connected' | 'notConfigured';
  notify: Record<'examAssigned' | 'resultPublished' | 'homeworkDue' | 'meetingReminder' | 'announcement', { email: boolean; inApp: boolean }>;
}

export interface RetentionSettings {
  examResultsYears: number;
  submissionsYears: number;
  messagesMonths: number;
  auditLogMonths: number;
  archivedAccountsYears: number;
  backupFrequency: 'daily' | 'weekly';
  backups: { id: string; at: string; sizeMb: number; status: 'success' | 'failed'; kind: 'auto' | 'manual' }[];
}
