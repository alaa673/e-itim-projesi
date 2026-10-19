/**
 * Teacher resources (provisional REST contracts — see docs/BACKEND_API_REQUIREMENTS.md).
 * The server must scope every response to the signed-in teacher's own classes.
 * AI-assisted actions (summary, questions, slides) run on the server; in demo mode they return
 * clearly labelled sample output built from local templates — no AI is called.
 */
import { nextId } from '@/mocks/collection';
import { mockDelay } from '@/mocks/utils';
import { api } from '@/services/api';
import { createResourceService, mockOr } from '@/services/resource';
import type { Difficulty, ExamType } from '@/types';
import type {
  Activity,
  Appeal,
  BankQuestion,
  ClassExam,
  Homework,
  Lesson,
  MockExam,
  Presentation,
  Rubric,
  SentSupport,
  Slide,
  StudyGroup,
  Submission,
} from '../types';
import type { TeacherClassRow, TeacherStudentRow, TeachingScope, TopicPercent } from '../types';

export type {
  Activity,
  Appeal,
  BankQuestion,
  ClassExam,
  Homework,
  Lesson,
  MockExam,
  Presentation,
  Rubric,
  SentSupport,
  Slide,
  StudyGroup,
  Submission,
  TeacherClassRow,
  TeacherStudentRow,
  TeachingScope,
  TopicPercent,
};

const teaching = () => import('@/mocks/db/teaching');
const insights = () => import('@/mocks/db/teacherInsights');
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const now = () => new Date().toISOString();

/* ── Classes & students ─────────────────────────────────────────────── */

export const classInsightApi = {
  list(signal?: AbortSignal): Promise<TeacherClassRow[]> {
    return mockOr(
      () => api.get<TeacherClassRow[]>('/teacher/classes', { signal }),
      async () => {
        const { teacherClassRows } = await insights();
        return mockDelay(() => teacherClassRows(), signal);
      },
    );
  },
};

export const studentInsightApi = createResourceService<TeacherStudentRow, never>('/teacher/students', () => insights().then((m) => m.teacherStudents), {
  create: () => {
    throw new Error('read only');
  },
});

/** Classes and topics of the signed-in teacher (GET /teacher/scope). */
export function teachingScopeApi(signal?: AbortSignal): Promise<TeachingScope> {
  return mockOr(
    () => api.get<TeachingScope>('/teacher/scope', { signal }),
    async () => {
      const { teachingScope } = await insights();
      return mockDelay(() => teachingScope(), signal, 200);
    },
  );
}

export async function rosterNames(className: string): Promise<string[]> {
  return mockOr(
    () => api.get<string[]>(`/teacher/classes/${encodeURIComponent(className)}/students`),
    async () => {
      const { rosterOf, fullName } = await import('@/mocks/mockStudents');
      return rosterOf(className).map(fullName);
    },
  );
}

/* ── Study groups ───────────────────────────────────────────────────── */

export type GroupInput = Omit<StudyGroup, 'id' | 'createdAt'>;
export const groupApi = createResourceService<StudyGroup, GroupInput>('/teacher/groups', () => teaching().then((m) => m.studyGroups), {
  create: (input) => ({ ...input, id: nextId('sg'), createdAt: now() }),
});

/* ── Lessons, summaries & AI helpers ────────────────────────────────── */

export type LessonInput = Omit<Lesson, 'id' | 'updatedAt' | 'views' | 'fileUrl'>;
export const lessonApi = createResourceService<Lesson, LessonInput>('/teacher/lessons', () => teaching().then((m) => m.lessons), {
  create: (input) => ({ ...input, id: nextId('ls'), updatedAt: now(), views: 0 }),
  update: (_c, input) => ({ ...input, updatedAt: now() }),
});

const SUMMARY_TEMPLATES: Record<string, string[]> = {
  Kesirler: ['Kesir, bir bütünün eş parçalarını gösterir; pay alınan parçayı, payda bütünün kaç parçaya bölündüğünü belirtir.', 'Toplama ve çıkarmada paydalar eşitlenir, paylar toplanır veya çıkarılır.', 'Çarpmada paylar ve paydalar kendi aralarında çarpılır; bölmede ikinci kesir ters çevrilip çarpılır.', 'Sonuç her zaman en sade biçimde yazılır.'],
  'Üslü İfadeler': ['Aynı tabanlı üslü ifadeler çarpılırken üsler toplanır, bölünürken çıkarılır.', 'Üssün üssü alınırken üsler çarpılır.', 'Sıfırdan farklı her sayının sıfırıncı kuvveti 1’dir.', 'Negatif üs, sayının çarpmaya göre tersini ifade eder.'],
  Denklemler: ['Denklem, bilinmeyen içeren bir eşitliktir.', 'Eşitliğin iki tarafına aynı işlem uygulanırsa eşitlik bozulmaz.', 'Bilinmeyen terimler bir tarafta, sayılar diğer tarafta toplanır.', 'Bulunan değer denklemde yerine konularak kontrol edilir.'],
};
const genericSummary = (topic: string) => [`${topic} konusunun temel kavramları ve tanımları.`, `${topic} ile ilgili kurallar ve örnek çözümler.`, 'Sık yapılan hatalar ve bunlardan kaçınma yolları.', 'Konu sonu tekrar soruları için ipuçları.'];

export interface SummaryResult {
  summary: string;
  /** True when the text is a demo template, not AI output. */
  simulated: boolean;
  /** Id of the uploaded PDF as stored by the server; sent back as `fileId` when the lesson is saved. */
  fileId?: string | null;
}

export function generateSummary(input: { file: File | null; topic: string; title: string }): Promise<SummaryResult> {
  return mockOr(
    () => {
      const body = new FormData();
      if (input.file) body.append('file', input.file);
      body.append('topic', input.topic);
      body.append('title', input.title);
      return api.post<SummaryResult>('/teacher/ai/summary', body, { timeoutMs: 120_000 });
    },
    () => mockDelay(() => ({ summary: (SUMMARY_TEMPLATES[input.topic] ?? genericSummary(input.topic)).join('\n'), simulated: true }), undefined, 1800),
  );
}

/* ── Question bank ──────────────────────────────────────────────────── */

export type BankInput = Omit<BankQuestion, 'id' | 'createdAt' | 'usedIn'>;
export const bankApi = createResourceService<BankQuestion, BankInput>('/teacher/questions', () => teaching().then((m) => m.bankQuestions), {
  create: (input) => ({ ...input, id: nextId('bq'), createdAt: now(), usedIn: 0 }),
});

export interface GeneratedQuestions {
  questions: BankQuestion[];
  simulated: boolean;
}

/** Draft questions for review; nothing is added to the bank until the teacher approves. */
export function generateQuestions(input: { topic: string; count: number; difficulty: Difficulty }): Promise<GeneratedQuestions> {
  return mockOr(
    () => api.post<GeneratedQuestions>('/teacher/ai/questions', input, { timeoutMs: 120_000 }),
    async () => {
      const { makeQuestions } = await import('@/mocks/db/questions');
      return mockDelay(
        () => ({
          simulated: true,
          questions: makeQuestions('Matematik', input.topic, input.count, Date.now() % 100_000).map((q) => ({
            id: nextId('gen'),
            stem: q.stem,
            options: q.options,
            answer: LETTERS[q.answer],
            subject: 'Matematik',
            topic: q.topic,
            difficulty: input.difficulty,
            source: 'generated' as const,
            status: 'draft' as const,
            createdAt: now(),
            usedIn: 0,
          })),
        }),
        undefined,
        1600,
      );
    },
  );
}

/* ── Presentations ──────────────────────────────────────────────────── */

export type PresentationInput = Omit<Presentation, 'id' | 'updatedAt'>;
export const presentationApi = createResourceService<Presentation, PresentationInput>('/teacher/presentations', () => teaching().then((m) => m.presentations), {
  create: (input) => ({ ...input, id: nextId('pr'), updatedAt: now() }),
  update: (_c, input) => ({ ...input, updatedAt: now() }),
});

export function generateSlides(input: { title: string; summary: string }): Promise<{ slides: Slide[]; simulated: boolean }> {
  return mockOr(
    () => api.post<{ slides: Slide[]; simulated: boolean }>('/teacher/ai/presentation', input, { timeoutMs: 120_000 }),
    () =>
      mockDelay(() => {
        const lines = input.summary.split('\n').map((l) => l.trim()).filter(Boolean);
        const slides: Slide[] = [{ title: input.title, bullets: ['Bugünkü hedefimiz', ...lines.slice(0, 1)] }];
        lines.forEach((line, i) => {
          const [head, ...rest] = line.split(':');
          slides.push({ title: rest.length ? head.trim() : `Adım ${i + 1}`, bullets: [rest.length ? rest.join(':').trim() : line] });
        });
        slides.push({ title: 'Özet ve soru zamanı', bullets: ['Bugün öğrendiklerimizi bir cümleyle özetleyelim.', 'Aklınıza takılan bir soru var mı?'] });
        return { slides, simulated: true };
      }, undefined, 1500),
  );
}

/* ── Exams, mock exams, homework, activities ────────────────────────── */

export type ExamInput = Omit<ClassExam, 'id' | 'completed' | 'average'>;
export const examApi = createResourceService<ClassExam, ExamInput>('/teacher/exams', () => teaching().then((m) => m.classExams), {
  create: (input) => ({ ...input, id: nextId('ce'), completed: 0, average: null }),
});

export type MockExamInput = Omit<MockExam, 'id'>;
export const mockExamApi = createResourceService<MockExam, MockExamInput>('/teacher/mock-exams', () => teaching().then((m) => m.mockExams), {
  create: (input) => ({ ...input, id: nextId('me') }),
});

export const MOCK_LAYOUTS: Record<ExamType, { subject: string; count: number }[]> = {
  LGS: [
    { subject: 'Türkçe', count: 20 },
    { subject: 'Matematik', count: 20 },
    { subject: 'Fen Bilimleri', count: 20 },
    { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', count: 10 },
    { subject: 'İngilizce', count: 10 },
  ],
  TYT: [
    { subject: 'Türkçe', count: 40 },
    { subject: 'Sosyal Bilimler', count: 20 },
    { subject: 'Temel Matematik', count: 40 },
    { subject: 'Fen Bilimleri', count: 20 },
  ],
  AYT: [
    { subject: 'Matematik', count: 40 },
    { subject: 'Fizik', count: 14 },
    { subject: 'Kimya', count: 13 },
    { subject: 'Biyoloji', count: 13 },
  ],
};

export type HomeworkInput = Omit<Homework, 'id' | 'submitted'>;
export const homeworkApi = createResourceService<Homework, HomeworkInput>('/teacher/homework', () => teaching().then((m) => m.homework), {
  create: (input) => ({ ...input, id: nextId('hw'), submitted: 0 }),
});

export type ActivityInput = Omit<Activity, 'id'>;
export const activityApi = createResourceService<Activity, ActivityInput>('/teacher/activities', () => teaching().then((m) => m.activities), {
  create: (input) => ({ ...input, id: nextId('ac') }),
});

/* ── Assessment ─────────────────────────────────────────────────────── */

export type RubricInput = Omit<Rubric, 'id' | 'usedIn' | 'updatedAt'>;
export const rubricApi = createResourceService<Rubric, RubricInput>('/teacher/rubrics', () => teaching().then((m) => m.rubrics), {
  create: (input) => ({ ...input, id: nextId('rb'), usedIn: 0, updatedAt: now() }),
  update: (_c, input) => ({ ...input, updatedAt: now() }),
});

export const submissionApi = createResourceService<Submission, Pick<Submission, 'score' | 'feedback' | 'status'>>('/teacher/submissions', () => teaching().then((m) => m.submissions), {
  create: () => {
    throw new Error('read only');
  },
});

export const appealApi = createResourceService<Appeal, Pick<Appeal, 'status' | 'response'>>('/teacher/appeals', () => teaching().then((m) => m.appeals), {
  create: () => {
    throw new Error('read only');
  },
});

export const sentSupportApi = createResourceService<SentSupport, never>('/teacher/support-exercises', () => teaching().then((m) => m.sentSupport), {
  create: () => {
    throw new Error('use teacherService.sendSupportExercise');
  },
});

/* ── Reports ────────────────────────────────────────────────────────── */

export interface ClassReport {
  className: string;
  subject: string;
  teacher: string;
  generatedAt: string;
  studentCount: number;
  average: number;
  topics: TopicPercent[];
  students: Pick<TeacherStudentRow, 'id' | 'name' | 'schoolNumber' | 'average' | 'lastScore' | 'weakTopic'>[];
  distribution: { range: string; count: number }[];
}

export function classReport(className: string, signal?: AbortSignal): Promise<ClassReport> {
  return mockOr(
    () => api.get<ClassReport>(`/teacher/reports/classes/${encodeURIComponent(className)}`, { signal }),
    async () => {
      const { teacherClassRows, teacherStudents } = await insights();
      return mockDelay(() => {
        const cls = teacherClassRows().find((c) => c.name === className);
        const students = teacherStudents.all().filter((s) => s.className === className).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        const ranges = ['0–49', '50–59', '60–69', '70–84', '85–100'];
        const bucket = (v: number) => (v < 50 ? 0 : v < 60 ? 1 : v < 70 ? 2 : v < 85 ? 3 : 4);
        const distribution = ranges.map((range) => ({ range, count: 0 }));
        for (const s of students) if (s.lastScore !== null) distribution[bucket(s.lastScore)].count += 1;
        return {
          className,
          subject: 'Matematik',
          teacher: 'Ayşe Yılmaz',
          generatedAt: now(),
          studentCount: students.length,
          average: cls?.average ?? 0,
          topics: cls?.topics ?? [],
          students: students.map(({ id, name, schoolNumber, average, lastScore, weakTopic }) => ({ id, name, schoolNumber, average, lastScore, weakTopic })),
          distribution,
        };
      }, signal);
    },
  );
}
