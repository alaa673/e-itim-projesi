/**
 * Administrator resources (provisional REST contracts — see docs/BACKEND_API_REQUIREMENTS.md).
 * In mock mode every call goes to the in-memory demo database, loaded lazily so a real build
 * never fetches the demo data. The backend must authorise every call (role = admin).
 */
import { nextId } from '@/mocks/collection';
import type {
  ArchiveFile,
  ArchiveQuestion,
  Career,
  DataSource,
  ExamType,
  HighSchool,
  ReviewQuestion,
  SchoolClass,
  SchoolLevel,
  Student,
  Subject,
  SupportRequest,
  Teacher,
  TeacherAssignment,
  Term,
  UniversityProgram,
  AuditEntry,
} from '@/types';
import { api } from '@/services/api';
import { createResourceService, mockOr } from '@/services/resource';
import { mockDelay } from '@/mocks/utils';
import type {
  AiSettings,
  AiUsageDay,
  InstitutionSettings,
  IntegrationSettings,
  PermissionRule,
  RetentionSettings,
  WeeklyUsage,
} from '../types';

export type { AiSettings, AiUsageDay, InstitutionSettings, IntegrationSettings, PermissionRule, RetentionSettings, WeeklyUsage };

const core = () => import('@/mocks/db/core');
const archive = () => import('@/mocks/db/archive');
const guidance = () => import('@/mocks/db/guidance');
const adminDb = () => import('@/mocks/db/admin');
const comms = () => import('@/mocks/db/comms');

/* ── Users & academic structure ─────────────────────────────────────── */

export interface TeacherInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  branch: string;
  status: Teacher['status'];
}

export const teacherApi = createResourceService<Teacher, TeacherInput>('/admin/teachers', () => core().then((m) => {
  m.syncTeacherClasses();
  return m.teachers;
}), {
  create: (input) => ({ ...input, id: nextId('t'), email: input.email.toLocaleLowerCase('tr-TR'), classIds: [], joinedAt: new Date().toISOString() }),
});

export interface TermInput {
  year: string;
  name: string;
  start: string;
  end: string;
}

export const termApi = {
  ...createResourceService<Term, TermInput>('/admin/terms', () => core().then((m) => m.terms), {
    create: (input) => ({ ...input, id: nextId('term'), status: 'upcoming' }),
  }),
  /** Makes a term the active one; the previous active term is archived (results stay available). */
  activate(id: string): Promise<Term> {
    return mockOr(
      () => api.post<Term>(`/admin/terms/${encodeURIComponent(id)}/activate`),
      async () => {
        const { terms } = await core();
        for (const term of terms.all()) if (term.status === 'current' && term.id !== id) terms.mutate(term.id, (t) => ({ ...t, status: 'archived' }));
        return terms.patch(id, { status: 'current' });
      },
    );
  },
};

export interface ClassInput {
  level: SchoolLevel;
  grade: number;
  section: string;
  homeroomTeacherId: string;
  capacity: number;
  room: string;
}

export const classApi = createResourceService<SchoolClass, ClassInput>('/admin/classes', () => core().then((m) => m.classes), {
  create: (input) => ({
    ...input,
    id: nextId('class'),
    name: `${input.grade}-${input.section}`,
    homeroomTeacherId: input.homeroomTeacherId || null,
    homeroomTeacher: null,
    studentCount: 0,
    status: 'active',
  }),
  update: (current, input) => ({ ...input, name: `${input.grade ?? current.grade}-${input.section ?? current.section}`, homeroomTeacherId: input.homeroomTeacherId || null }),
});

/** Students of one class (roster) and moving a student to another class. */
export const rosterApi = {
  list(className: string, signal?: AbortSignal): Promise<Student[]> {
    return mockOr(
      () => api.get<Student[]>(`/admin/classes/${encodeURIComponent(className)}/students`, { signal }),
      async () => {
        const { rosterOf } = await import('@/mocks/mockStudents');
        return mockDelay(() => rosterOf(className).map((s) => ({ ...s })), signal);
      },
    );
  },
  /** Transfer keeps the student's past results (server responsibility). */
  transfer(studentId: string, toClass: { grade: number; section: string; level: SchoolLevel }): Promise<Student> {
    return mockOr(
      () => api.post<Student>(`/admin/students/${encodeURIComponent(studentId)}/transfer`, toClass),
      async () => {
        const { mockStudentTable } = await import('@/mocks/mockStudents');
        const { classes } = await core();
        return mockDelay(() => {
          const s = mockStudentTable.find((x) => x.id === studentId);
          if (!s) throw new Error('not_found');
          const from = `${s.grade}-${s.section}`;
          Object.assign(s, toClass);
          const to = `${toClass.grade}-${toClass.section}`;
          for (const c of classes.all()) {
            if (c.name === from) classes.mutate(c.id, (x) => ({ ...x, studentCount: Math.max(0, x.studentCount - 1) }));
            if (c.name === to) classes.mutate(c.id, (x) => ({ ...x, studentCount: x.studentCount + 1 }));
          }
          return { ...s };
        }, undefined, 500);
      },
    );
  },
};

export interface SubjectInput {
  name: string;
  levels: SchoolLevel[];
  grades: number[];
  weeklyHours: number;
  units?: Subject['units'];
  status?: Subject['status'];
}

export const subjectApi = createResourceService<Subject, SubjectInput>('/admin/subjects', () => core().then((m) => m.subjects), {
  create: (input) => ({ units: [], status: 'active', ...input, id: nextId('sub') }),
});

export const assignmentApi = {
  ...createResourceService<TeacherAssignment, { teacherId: string | null }>('/admin/assignments', () => core().then((m) => m.assignments), {
    create: () => {
      throw new Error('not supported');
    },
    update: (_current, input) => ({ teacherId: input.teacherId ?? null, status: input.teacherId ? 'assigned' : 'pending' }),
  }),
};

/** Resolves teacherName for the mock after an assignment change (the real API returns it). */
export async function assignTeacher(assignmentId: string, teacherId: string | null): Promise<TeacherAssignment> {
  return mockOr(
    () => api.patch<TeacherAssignment>(`/admin/assignments/${encodeURIComponent(assignmentId)}`, { teacherId }),
    async () => {
      const { assignments, teacherName } = await core();
      return assignments.patch(assignmentId, { teacherId, teacherName: teacherName(teacherId), status: teacherId ? 'assigned' : 'pending' });
    },
  );
}

/** Options used by many admin forms (all active teachers / all classes). */
export const lookupApi = {
  teachers(signal?: AbortSignal): Promise<Teacher[]> {
    return mockOr(
      () => api.get<Teacher[]>('/admin/lookups/teachers', { signal }),
      async () => {
        const { teachers } = await core();
        return mockDelay(() => teachers.all().filter((t) => t.status === 'active'), signal, 120);
      },
    );
  },
  classes(signal?: AbortSignal): Promise<SchoolClass[]> {
    return mockOr(
      () => api.get<SchoolClass[]>('/admin/lookups/classes', { signal }),
      async () => {
        const { classes } = await core();
        return mockDelay(() => classes.all().filter((c) => c.status === 'active'), signal, 120);
      },
    );
  },
  subjects(signal?: AbortSignal): Promise<Subject[]> {
    return mockOr(
      () => api.get<Subject[]>('/admin/lookups/subjects', { signal }),
      async () => {
        const { subjects } = await core();
        return mockDelay(() => subjects.all(), signal, 120);
      },
    );
  },
};

/* ── Bulk import ────────────────────────────────────────────────────── */

export interface ImportRow {
  firstName: string;
  lastName: string;
  email: string;
  /** students: school number · teachers: branch */
  extra: string;
  /** students: class like "8-A" */
  className?: string;
}

/** The server re-validates every row; the browser check only gives early feedback. */
export function importUsers(kind: 'students' | 'teachers', rows: ImportRow[]): Promise<{ created: number }> {
  return mockOr(
    () => api.post<{ created: number }>(`/admin/import/${kind}`, { rows }),
    async () => {
      if (kind === 'teachers') {
        const { teachers } = await core();
        for (const r of rows) {
          await teachers.insert({ id: nextId('t'), firstName: r.firstName, lastName: r.lastName, email: r.email.toLocaleLowerCase('tr-TR'), phone: '', branch: r.extra, classIds: [], status: 'active', joinedAt: new Date().toISOString() });
        }
      } else {
        const { mockStudentTable } = await import('@/mocks/mockStudents');
        for (const r of rows) {
          const [grade, section] = (r.className ?? '').split('-');
          const g = Number(grade);
          mockStudentTable.unshift({
            id: nextId('stu'),
            schoolNumber: r.extra,
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email.toLocaleLowerCase('tr-TR'),
            level: g <= 4 ? 'primary' : g <= 8 ? 'middle' : 'high',
            grade: g,
            section: section ?? 'A',
            status: 'active',
            enrolledAt: new Date().toISOString(),
          });
        }
      }
      return mockDelay(() => ({ created: rows.length }), undefined, 700);
    },
  );
}

/** Emails / school numbers already in the system (for duplicate warnings before import). */
export function existingKeys(kind: 'students' | 'teachers'): Promise<{ emails: string[]; numbers: string[] }> {
  return mockOr(
    () => api.get<{ emails: string[]; numbers: string[] }>(`/admin/import/${kind}/existing-keys`),
    async () => {
      if (kind === 'teachers') {
        const { teachers } = await core();
        return { emails: teachers.all().map((t) => t.email.toLocaleLowerCase('tr-TR')), numbers: [] };
      }
      const { mockStudentTable } = await import('@/mocks/mockStudents');
      return { emails: mockStudentTable.map((s) => s.email.toLocaleLowerCase('tr-TR')), numbers: mockStudentTable.map((s) => s.schoolNumber) };
    },
  );
}

/* ── Exam archive ───────────────────────────────────────────────────── */

export interface UploadInput {
  examType: ExamType;
  year: number;
  kind: ArchiveFile['kind'];
  file: File;
}

/** Demo processing speed: a new upload goes through the pipeline in ~24 seconds. */
const DEMO_PIPELINE_MS = 24_000;
const pipelineSeen = new Map<string, { at: number; from: number }>();

async function advanceDemoPipeline() {
  const { archiveFiles, reviewQueue } = await archive();
  const { makeQuestions, letterOf } = await import('@/mocks/db/questions');
  const now = Date.now();
  for (const f of archiveFiles.all()) {
    if (f.status !== 'running' && f.status !== 'waiting') continue;
    // Progress grows from the moment the demo first saw the job (seeded jobs keep their starting percentage).
    if (!pipelineSeen.has(f.id)) pipelineSeen.set(f.id, { at: now, from: f.progress });
    const seen = pipelineSeen.get(f.id)!;
    const progress = Math.min(100, Math.round(seen.from + ((now - seen.at) / DEMO_PIPELINE_MS) * 100));
    if (progress < 100) {
      archiveFiles.mutate(f.id, (x) => ({ ...x, status: 'running', progress }));
      continue;
    }
    const count = f.kind === 'answerKey' ? 0 : 12;
    archiveFiles.mutate(f.id, (x) => ({ ...x, status: f.kind === 'answerKey' ? 'done' : 'review', progress: 100, questionCount: f.kind === 'answerKey' ? 40 : count }));
    if (count) {
      const items = makeQuestions('Matematik', null, count, now % 10_000);
      items.forEach((q, i) =>
        reviewQueue.all().push({
          id: `${f.id}-q${i + 1}`,
          fileId: f.id,
          fileName: f.fileName,
          number: i + 1,
          examType: f.examType,
          year: f.year,
          stem: q.stem,
          options: q.options.map((o, j) => `${letterOf(j)}) ${o}`),
          answer: letterOf(q.answer),
          subject: q.subject,
          topic: q.topic,
          confidence: 80 + (i % 4) * 5,
          hasFigure: false,
          status: 'pending',
        }),
      );
    }
  }
}

export const archiveFileApi = {
  ...createResourceService<ArchiveFile, never>('/admin/archive/files', async () => {
    await advanceDemoPipeline();
    return (await archive()).archiveFiles;
  }, {
    create: () => {
      throw new Error('use upload');
    },
  }),
  upload(input: UploadInput, uploadedBy: string): Promise<ArchiveFile> {
    return mockOr(
      () => {
        const body = new FormData();
        body.append('file', input.file);
        body.append('examType', input.examType);
        body.append('year', String(input.year));
        body.append('kind', input.kind);
        return api.post<ArchiveFile>('/admin/archive/files', body);
      },
      async () => {
        const { archiveFiles } = await archive();
        return archiveFiles.insert({
          id: nextId('up'),
          fileName: input.file.name,
          examType: input.examType,
          year: input.year,
          kind: input.kind,
          sizeBytes: input.file.size,
          pages: Math.max(1, Math.round(input.file.size / 250_000)),
          uploadedAt: new Date().toISOString(),
          uploadedBy,
          status: 'waiting',
          progress: 0,
          questionCount: null,
          error: null,
        });
      },
    );
  },
  retry(id: string): Promise<ArchiveFile> {
    pipelineSeen.delete(id);
    return mockOr(
      () => api.post<ArchiveFile>(`/admin/archive/files/${encodeURIComponent(id)}/retry`),
      async () => (await archive()).archiveFiles.patch(id, { status: 'waiting', progress: 0, error: null, uploadedAt: new Date().toISOString(), id }),
    );
  },
};

export const reviewApi = {
  ...createResourceService<ReviewQuestion, never>('/admin/archive/review', async () => {
    await advanceDemoPipeline();
    return (await archive()).reviewQueue;
  }, {
    create: () => {
      throw new Error('not supported');
    },
  }),
  /** Approve (with the reviewer's corrections). The server stores the question in the archive. */
  approve(id: string, edits: Pick<ReviewQuestion, 'stem' | 'options' | 'answer' | 'subject' | 'topic'> & { difficulty: ArchiveQuestion['difficulty'] }): Promise<ReviewQuestion> {
    return mockOr(
      () => api.post<ReviewQuestion>(`/admin/archive/review/${encodeURIComponent(id)}/approve`, edits),
      async () => {
        const { reviewQueue, approvedQuestions } = await archive();
        const current = reviewQueue.find(id);
        const updated = await reviewQueue.patch(id, { ...edits, status: 'approved' });
        if (current) {
          await approvedQuestions.insert({
            id: nextId('aq'),
            examType: current.examType,
            year: current.year,
            number: current.number,
            subject: edits.subject,
            topic: edits.topic,
            difficulty: edits.difficulty,
            stem: edits.stem,
            options: edits.options.map((o) => o.replace(/^[A-E]\)\s*/, '')),
            answer: edits.answer,
            usedCount: 0,
            duplicateOf: null,
            status: 'active',
          });
          // Close the file's review once nothing is pending.
          const { archiveFiles } = await archive();
          if (!reviewQueue.all().some((q) => q.fileId === current.fileId && q.status === 'pending')) archiveFiles.mutate(current.fileId, (f) => ({ ...f, status: 'done' }));
        }
        return updated;
      },
    );
  },
  reject(id: string): Promise<ReviewQuestion> {
    return mockOr(
      () => api.post<ReviewQuestion>(`/admin/archive/review/${encodeURIComponent(id)}/reject`),
      async () => (await archive()).reviewQueue.patch(id, { status: 'rejected' }),
    );
  },
};

export const approvedApi = createResourceService<ArchiveQuestion, Partial<ArchiveQuestion>>('/admin/archive/questions', () => archive().then((m) => m.approvedQuestions), {
  create: () => {
    throw new Error('not supported');
  },
});

export async function archiveSubjects(): Promise<Record<ExamType, string[]>> {
  return mockOr(() => api.get<Record<ExamType, string[]>>('/admin/archive/subjects'), async () => (await archive()).examSubjects);
}

/* ── Guidance data ──────────────────────────────────────────────────── */

export type SchoolInput = Omit<HighSchool, 'id'>;
export const schoolApi = createResourceService<HighSchool, SchoolInput>('/admin/guidance/schools', () => guidance().then((m) => m.schools), {
  create: (input) => ({ ...input, id: nextId('hs') }),
});

export type ProgramInput = Omit<UniversityProgram, 'id'>;
export const programApi = createResourceService<UniversityProgram, ProgramInput>('/admin/guidance/programs', () => guidance().then((m) => m.programs), {
  create: (input) => ({ ...input, id: nextId('prg') }),
});

export type CareerInput = Omit<Career, 'id'>;
export const careerApi = createResourceService<Career, CareerInput>('/admin/guidance/careers', () => guidance().then((m) => m.careers), {
  create: (input) => ({ ...input, id: nextId('car') }),
});

export const dataSourceApi = {
  ...createResourceService<DataSource, never>('/admin/guidance/sources', async () => {
    const { dataSources } = await guidance();
    for (const s of dataSources.all()) {
      if (s.status === 'importing' && Date.now() - new Date(s.updatedAt).getTime() > 6000) dataSources.mutate(s.id, (x) => ({ ...x, status: 'current' }));
    }
    return dataSources;
  }, {
    create: () => {
      throw new Error('use importFile');
    },
  }),
  importFile(dataset: DataSource['dataset'], file: File, updatedBy: string, records: number): Promise<DataSource> {
    return mockOr(
      () => {
        const body = new FormData();
        body.append('file', file);
        return api.post<DataSource>(`/admin/guidance/${dataset}/import`, body);
      },
      async () => {
        const { dataSources } = await guidance();
        for (const s of dataSources.all()) if (s.dataset === dataset && s.status === 'current') dataSources.mutate(s.id, (x) => ({ ...x, status: 'outdated' }));
        return dataSources.insert({ id: nextId('ds'), dataset, source: file.name, year: new Date().getFullYear(), records, updatedAt: new Date().toISOString(), updatedBy, status: 'importing' });
      },
    );
  },
};

/* ── Support requests ───────────────────────────────────────────────── */

export const supportRequestApi = {
  ...createResourceService<SupportRequest, { status: SupportRequest['status'] }>('/admin/support-requests', () => comms().then((m) => m.supportRequests), {
    create: () => {
      throw new Error('not supported');
    },
  }),
  reply(id: string, text: string, from: string): Promise<SupportRequest> {
    return mockOr(
      () => api.post<SupportRequest>(`/admin/support-requests/${encodeURIComponent(id)}/messages`, { text }),
      async () => {
        const { supportRequests } = await comms();
        const current = supportRequests.find(id);
        return supportRequests.patch(id, {
          messages: [...(current?.messages ?? []), { id: nextId('m'), from, fromRole: 'admin', text, at: new Date().toISOString() }],
          status: current?.status === 'open' ? 'inProgress' : current?.status,
        });
      },
    );
  },
};

/* ── Reports ────────────────────────────────────────────────────────── */

export interface UsageReport {
  weeks: WeeklyUsage[];
  byRole: { role: 'student' | 'teacher' | 'admin'; active: number; total: number }[];
  topPages: { page: string; views: number }[];
}

export function usageReport(signal?: AbortSignal): Promise<UsageReport> {
  return mockOr(
    () => api.get<UsageReport>('/admin/reports/usage', { signal }),
    async () => {
      const { usageSeries } = await adminDb();
      return mockDelay(
        () => ({
          weeks: usageSeries(),
          byRole: [
            { role: 'student', active: 846, total: 982 },
            { role: 'teacher', active: 41, total: 46 },
            { role: 'admin', active: 2, total: 2 },
          ],
          topPages: [
            { page: 'student.home', views: 12480 },
            { page: 'student.exams', views: 6120 },
            { page: 'student.topicAnalysis', views: 4210 },
            { page: 'teacher.resultsAnalysis', views: 1890 },
            { page: 'teacher.questionBank', views: 1460 },
            { page: 'admin.students', views: 380 },
          ],
        }),
        signal,
      );
    },
  );
}

export interface AiReport {
  days: AiUsageDay[];
  features: { key: string; operations: number; cost: number }[];
  monthlyBudget: number;
}

export function aiReport(signal?: AbortSignal): Promise<AiReport> {
  return mockOr(
    () => api.get<AiReport>('/admin/reports/ai', { signal }),
    async () => {
      const { aiUsageSeries, AI_FEATURES, settingsStore } = await adminDb();
      return mockDelay(() => ({ days: aiUsageSeries(), features: AI_FEATURES.map((f) => ({ ...f })), monthlyBudget: settingsStore.ai.monthlyBudget }), signal);
    },
  );
}

export const auditApi = createResourceService<AuditEntry, never>('/admin/reports/audit', () => adminDb().then((m) => m.auditLog), {
  create: () => {
    throw new Error('read only');
  },
});

/* ── Settings ───────────────────────────────────────────────────────── */

export type SettingsKey = 'institution' | 'permissions' | 'ai' | 'integrations' | 'retention';
export type SettingsMap = {
  institution: InstitutionSettings;
  permissions: PermissionRule[];
  ai: AiSettings;
  integrations: IntegrationSettings;
  retention: RetentionSettings;
};

export const settingsApi = {
  get<K extends SettingsKey>(key: K, signal?: AbortSignal): Promise<SettingsMap[K]> {
    return mockOr(
      () => api.get<SettingsMap[K]>(`/admin/settings/${key}`, { signal }),
      async () => {
        const { settingsStore } = await adminDb();
        return mockDelay(() => structuredClone(settingsStore[key]) as SettingsMap[K], signal);
      },
    );
  },
  save<K extends SettingsKey>(key: K, value: SettingsMap[K]): Promise<SettingsMap[K]> {
    return mockOr(
      () => api.put<SettingsMap[K]>(`/admin/settings/${key}`, value),
      async () => {
        const { settingsStore } = await adminDb();
        return mockDelay(() => {
          const next = structuredClone(value);
          // The key fields are owned by setAiKey / testAi, never by a settings save.
          if (key === 'ai') Object.assign(next, { keyStatus: settingsStore.ai.keyStatus, keyHint: settingsStore.ai.keyHint, lastTestAt: settingsStore.ai.lastTestAt });
          (settingsStore as SettingsMap)[key] = next;
          return structuredClone(next);
        }, undefined, 500);
      },
    );
  },
  /**
   * Sends a new AI provider key to the server, which stores it encrypted. The key is never kept
   * in the browser, never returned by the API (only a masked hint), and never placed in VITE_ variables.
   */
  setAiKey(key: string): Promise<AiSettings> {
    return mockOr(
      () => api.post<AiSettings>('/admin/settings/ai/key', { key }),
      async () => {
        const { settingsStore } = await adminDb();
        return mockDelay(() => {
          // Demo: the key itself is discarded immediately; only a masked hint is kept.
          settingsStore.ai = { ...settingsStore.ai, keyStatus: 'configured', keyHint: `••••${key.slice(-4)}` };
          return structuredClone(settingsStore.ai);
        }, undefined, 600);
      },
    );
  },
  testAi(): Promise<{ ok: boolean; latencyMs: number }> {
    return mockOr(
      () => api.post<{ ok: boolean; latencyMs: number }>('/admin/settings/ai/test'),
      async () => {
        const { settingsStore } = await adminDb();
        return mockDelay(() => {
          settingsStore.ai.lastTestAt = new Date().toISOString();
          return { ok: settingsStore.ai.keyStatus === 'configured', latencyMs: 640 };
        }, undefined, 900);
      },
    );
  },
  createBackup(): Promise<RetentionSettings> {
    return mockOr(
      () => api.post<RetentionSettings>('/admin/settings/retention/backups'),
      async () => {
        const { settingsStore } = await adminDb();
        return mockDelay(() => {
          settingsStore.retention.backups.unshift({ id: nextId('bk'), at: new Date().toISOString(), sizeMb: 845, status: 'success', kind: 'manual' });
          return structuredClone(settingsStore.retention);
        }, undefined, 1400);
      },
    );
  },
};
