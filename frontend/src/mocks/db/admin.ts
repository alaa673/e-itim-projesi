/** Reports and settings for the administrator. DEVELOPMENT-ONLY demo data. */
import type { AuditEntry } from '@/types';
import { createCollection } from '../collection';
import { createRandom, pick, relativeDate } from '../utils';
import type { WeeklyUsage, AiUsageDay, InstitutionSettings, PermissionRule, AiSettings, IntegrationSettings, RetentionSettings } from '@/features/admin/types';

export function usageSeries(): WeeklyUsage[] {
  const random = createRandom(330);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (11 - i) * 7);
    const growth = 1 + i * 0.03;
    return {
      week: d.toISOString(),
      activeStudents: Math.round((640 + random() * 120) * growth),
      activeTeachers: Math.round((30 + random() * 8) * Math.min(growth, 1.25)),
      examsTaken: Math.round((180 + random() * 90) * growth),
      filesUploaded: Math.round(12 + random() * 18),
    };
  });
}

export function aiUsageSeries(): AiUsageDay[] {
  const random = createRandom(4242);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const ops = Math.round((weekend ? 12 : 48) + random() * (weekend ? 10 : 30));
    return { date: d.toISOString(), operations: ops, cost: Math.round(ops * (0.9 + random() * 0.5) * 100) / 100 };
  });
}

export const AI_FEATURES = [
  { key: 'pdfExtraction', operations: 412, cost: 486 },
  { key: 'summaries', operations: 268, cost: 214 },
  { key: 'questionGeneration', operations: 331, cost: 397 },
  { key: 'presentations', operations: 74, cost: 96 },
  { key: 'guidance', operations: 183, cost: 61 },
] as const;

const ACTIONS: { action: string; target: (r: () => number) => string; role: AuditEntry['actorRole']; actor: string }[] = [
  { action: 'studentCreated', target: (r) => `${pick(r, ['Kerem Arslan', 'Duru Kaya', 'Yusuf Çelik', 'Azra Koç'])} (${pick(r, ['9-C', '5-B', '7-A', '10-D'])})`, role: 'admin', actor: 'Hakan Öztürk' },
  { action: 'studentUpdated', target: (r) => `${pick(r, ['Ela Demir', 'Mert Arslan', 'Nisa Kurt'])}`, role: 'admin', actor: 'Hakan Öztürk' },
  { action: 'accountDeactivated', target: () => 'Selin Tekin', role: 'admin', actor: 'Hakan Öztürk' },
  { action: 'teacherAssigned', target: (r) => `${pick(r, ['Ayşe Yılmaz → 8-B Matematik', 'Can Aksoy → 10-A Fizik', 'Ela Güneş → 6-C Türkçe'])}`, role: 'admin', actor: 'Hakan Öztürk' },
  { action: 'pdfUploaded', target: (r) => pick(r, ['LGS_Matematik.pdf', 'TYT_2025_Temel_Yeterlilik.pdf', 'AYT_2025_Sayisal.pdf']), role: 'admin', actor: 'Hakan Öztürk' },
  { action: 'questionsApproved', target: (r) => `${10 + Math.floor(r() * 30)} soru · LGS 2024`, role: 'admin', actor: 'Hakan Öztürk' },
  { action: 'announcementPublished', target: () => 'Veli toplantısı takvimi', role: 'admin', actor: 'Hakan Öztürk' },
  { action: 'settingsChanged', target: (r) => pick(r, ['Yapay zekâ kullanım limitleri', 'Bildirim ayarları', 'Saklama süreleri']), role: 'admin', actor: 'Hakan Öztürk' },
  { action: 'examAssigned', target: (r) => `${pick(r, ['Kesirler Quiz', 'Üslü Sayılar Quiz', 'LGS Deneme 2'])} → ${pick(r, ['8-A', '8-B', '7-C'])}`, role: 'teacher', actor: 'Ayşe Yılmaz' },
  { action: 'gradesPublished', target: (r) => `${pick(r, ['Oran-orantı ödevi', 'Denklemler quizi'])}`, role: 'teacher', actor: 'Ayşe Yılmaz' },
  { action: 'backupCompleted', target: () => 'Günlük yedek', role: 'system', actor: 'Sistem' },
];

function seedAudit(): AuditEntry[] {
  const random = createRandom(9090);
  return Array.from({ length: 96 }, (_, i) => {
    const a = pick(random, ACTIONS);
    const minutes = i * (30 + Math.floor(random() * 140)) + 8;
    return {
      id: `log-${i + 1}`,
      at: new Date(Date.now() - minutes * 60_000).toISOString(),
      actor: a.actor,
      actorRole: a.role,
      action: a.action,
      target: a.target(random),
      ip: a.role === 'system' ? '—' : `10.0.${Math.floor(random() * 4)}.${10 + Math.floor(random() * 200)}`,
    };
  });
}

export const auditLog = createCollection<AuditEntry>(seedAudit, {
  searchText: (e) => `${e.actor} ${e.target} ${e.action}`,
  sorters: { at: (a, b) => a.at.localeCompare(b.at) },
  defaultSort: 'at',
});

/* ── Settings (single documents) ─────────────────────────────────── */

export const settingsStore = {
  institution: {
    name: 'Demo Okulu', shortName: 'DO', type: 'Ortaokul ve Lise', city: 'Hatay', address: 'Atatürk Cad. No: 12, İskenderun',
    phone: '0326 555 01 02', email: 'bilgi@demo.okul', website: 'https://demo.okul', defaultLanguage: 'tr', lessonMinutes: 40, gradingScale: '100', logoDataUrl: null,
  } as InstitutionSettings,
  permissions: [
    { key: 'createStudents', group: 'users', admin: true, teacher: false, student: false, locked: true },
    { key: 'editStudents', group: 'users', admin: true, teacher: false, student: false, locked: false },
    { key: 'moveStudents', group: 'users', admin: true, teacher: false, student: false, locked: true },
    { key: 'viewStudentProfiles', group: 'users', admin: true, teacher: true, student: false, locked: false },
    { key: 'uploadContent', group: 'content', admin: true, teacher: true, student: false, locked: false },
    { key: 'generateWithAi', group: 'content', admin: true, teacher: true, student: false, locked: false },
    { key: 'shareContent', group: 'content', admin: true, teacher: true, student: false, locked: false },
    { key: 'createExams', group: 'exams', admin: true, teacher: true, student: false, locked: false },
    { key: 'useArchive', group: 'exams', admin: true, teacher: true, student: false, locked: false },
    { key: 'studentMockExams', group: 'exams', admin: true, teacher: true, student: true, locked: false },
    { key: 'publishGrades', group: 'exams', admin: true, teacher: true, student: false, locked: false },
    { key: 'exportReports', group: 'reports', admin: true, teacher: true, student: false, locked: false },
    { key: 'viewInstitutionReports', group: 'reports', admin: true, teacher: false, student: false, locked: true },
    { key: 'messageStudents', group: 'communication', admin: true, teacher: true, student: false, locked: false },
    { key: 'studentMessaging', group: 'communication', admin: true, teacher: true, student: true, locked: false },
    { key: 'publishAnnouncements', group: 'communication', admin: true, teacher: true, student: false, locked: false },
  ] as PermissionRule[],
  ai: {
    provider: 'anthropic', model: 'claude-sonnet', keyStatus: 'configured', keyHint: '••••7Q2c', monthlyBudget: 3000, teacherDailyLimit: 40, studentDailyLimit: 10,
    features: { pdfExtraction: true, summaries: true, questionGeneration: true, presentations: true, guidance: false }, lastTestAt: relativeDate(-1, 10, 5),
  } as AiSettings,
  integrations: {
    meetingProvider: 'jitsi', meetingBaseUrl: 'https://meet.demo.okul', emailEnabled: true, senderAddress: 'bildirim@demo.okul', smtpStatus: 'connected',
    notify: {
      examAssigned: { email: true, inApp: true }, resultPublished: { email: false, inApp: true }, homeworkDue: { email: true, inApp: true },
      meetingReminder: { email: true, inApp: true }, announcement: { email: false, inApp: true },
    },
  } as IntegrationSettings,
  retention: {
    examResultsYears: 5, submissionsYears: 2, messagesMonths: 12, auditLogMonths: 24, archivedAccountsYears: 3, backupFrequency: 'daily',
    backups: [
      { id: 'bk-1', at: relativeDate(0, 2, 0), sizeMb: 842, status: 'success', kind: 'auto' },
      { id: 'bk-2', at: relativeDate(-1, 2, 0), sizeMb: 839, status: 'success', kind: 'auto' },
      { id: 'bk-3', at: relativeDate(-2, 2, 0), sizeMb: 836, status: 'success', kind: 'auto' },
      { id: 'bk-4', at: relativeDate(-3, 2, 0), sizeMb: 0, status: 'failed', kind: 'auto' },
      { id: 'bk-5', at: relativeDate(-3, 9, 30), sizeMb: 833, status: 'success', kind: 'manual' },
    ],
  } as RetentionSettings,
};

export type { WeeklyUsage, AiUsageDay, InstitutionSettings, PermissionRule, AiSettings, IntegrationSettings, RetentionSettings };
