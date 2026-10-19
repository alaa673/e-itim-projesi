/**
 * Student resources (provisional REST contracts — see docs/BACKEND_API_REQUIREMENTS.md).
 * Every response must be scoped by the server to the signed-in student; answers are scored on the
 * server in production (the browser never receives the answer key before submitting).
 */
import type { QuizGrade, QuizQuestion, QuizResult } from '@/components/quiz/QuizPlayer';
import { nextId } from '@/mocks/collection';
import { mockDelay } from '@/mocks/utils';
import { api } from '@/services/api';
import { createResourceService, mockOr } from '@/services/resource';
import type { Career, HighSchool, UniversityProgram } from '@/types';
import type {
  AvailableMock,
  InterestProfile,
  MajorSuggestion,
  Material,
  MistakeEntry,
  MockAttempt,
  ResultEntry,
  RoadmapStep,
  SavedChoice,
  StudentActivity,
  StudentExam,
  StudentGoal,
  StudentHomework,
  StudentSubject,
  SupportExerciseItem,
} from '../types';

const learning = () => import('@/mocks/db/learning');
const guidance = () => import('@/mocks/db/guidance');

export const subjectApi = {
  list(signal?: AbortSignal): Promise<StudentSubject[]> {
    return mockOr(
      () => api.get<StudentSubject[]>('/student/subjects', { signal }),
      async () => {
        const { studentSubjects } = await learning();
        return mockDelay(() => studentSubjects().all().map((s) => structuredClone(s)), signal);
      },
    );
  },
};

export const materialApi = createResourceService<Material, Pick<Material, 'read'>>('/student/materials', () => learning().then((m) => m.studentMaterials()), {
  create: () => {
    throw new Error('read only');
  },
});

export const examApi = createResourceService<StudentExam, Pick<StudentExam, 'status' | 'score'>>('/student/exams', () => learning().then((m) => m.studentExams()), {
  create: () => {
    throw new Error('read only');
  },
});

/* ── Questions & submissions ────────────────────────────────────────── */

/**
 * Practice/exam questions. Demo: generated locally (answers included so the player can show feedback).
 * Production: GET returns questions WITHOUT answers; the result comes back from the submit call.
 */
export function practiceQuestions(input: { subject: string; topic: string | null; count: number; seed?: number }, signal?: AbortSignal): Promise<QuizQuestion[]> {
  return mockOr(
    () => api.get<QuizQuestion[]>('/student/practice/questions', { signal, query: { subject: input.subject, topic: input.topic ?? undefined, count: input.count } }),
    async () => {
      const { makeQuestions } = await import('@/mocks/db/questions');
      return mockDelay(() => {
        const items = makeQuestions(input.subject, input.topic, input.count, input.seed ?? (Date.now() % 100_000));
        return items.map((q) => ({ id: q.id, stem: q.stem, options: q.options, answer: q.answer, explanation: q.explanation, subject: q.subject, topic: q.topic }));
      }, signal, 250);
    },
  );
}

const TOPIC_HINTS: [RegExp, string][] = [
  [/kesir/i, 'Kesirler'],
  [/üslü/i, 'Üslü İfadeler'],
  [/denklem/i, 'Denklemler'],
  [/oran/i, 'Oran ve Orantı'],
  [/olasılık/i, 'Olasılık'],
];

/**
 * Questions of an open exam. Production: GET /student/exams/:id/questions returns them WITHOUT
 * answers (the key comes back from submitExam). Demo: generated from the exam's subject/title.
 */
export function examQuestions(exam: StudentExam, signal?: AbortSignal): Promise<QuizQuestion[]> {
  return mockOr(
    () => api.get<QuizQuestion[]>(`/student/exams/${encodeURIComponent(exam.id)}/questions`, { signal }),
    () =>
      practiceQuestions(
        { subject: exam.subject, topic: TOPIC_HINTS.find(([re]) => re.test(exam.title))?.[1] ?? null, count: Math.min(exam.questionCount, 15), seed: exam.id.length * 131 },
        signal,
      ),
  );
}

/** Server-graded submission: the response carries the updated exam and the answer key for the review. */
export interface ExamSubmission extends QuizGrade {
  exam: StudentExam;
}

export function submitExam(exam: StudentExam, questions: QuizQuestion[], answers: (number | null)[], durationSeconds: number): Promise<ExamSubmission> {
  return mockOr(
    () => api.post<ExamSubmission>(`/student/exams/${encodeURIComponent(exam.id)}/submit`, { answers, durationSeconds }),
    async () => {
      const { studentExams, studentResults } = await learning();
      const correct = questions.filter((q, i) => answers[i] !== null && answers[i] === q.answer).length;
      const percent = questions.length ? Math.round((correct / questions.length) * 100) : 0;
      const updated = await studentExams().patch(exam.id, { status: 'completed', score: percent });
      await studentResults().insert({ id: nextId('r'), title: exam.title, subject: exam.subject, kind: 'exam', date: new Date().toISOString(), score: percent, classAverage: 64, feedback: null });
      return { exam: updated, answerKey: questions.map((q) => q.answer ?? -1), explanations: questions.map((q) => q.explanation ?? null) };
    },
  );
}

export function saveMistakes(questions: QuizQuestion[], answers: (number | null)[]): Promise<number> {
  return mockOr(
    () => api.post<number>('/student/mistakes', { questionIds: questions.map((q) => q.id), answers }),
    async () => {
      const { studentMistakes } = await learning();
      for (const [i, q] of questions.entries()) {
        await studentMistakes().insert({
          id: nextId('mk'),
          subject: q.subject ?? 'Matematik',
          topic: q.topic ?? '',
          stem: q.stem,
          options: q.options,
          // Questions handed over from a finished quiz always carry the (server) answer key.
          answer: q.answer ?? -1,
          yourAnswer: answers[i] ?? null,
          explanation: q.explanation ?? '',
          savedAt: new Date().toISOString(),
          learned: false,
        });
      }
      return questions.length;
    },
  );
}

/* ── Homework, activities, results, appeals ─────────────────────────── */

export const homeworkApi = {
  ...createResourceService<StudentHomework, Pick<StudentHomework, 'status' | 'submission'>>('/student/homework', () => learning().then((m) => m.studentHomework()), {
    create: () => {
      throw new Error('read only');
    },
  }),
  submit(id: string, input: { text: string; file: File | null }): Promise<StudentHomework> {
    return mockOr(
      () => {
        const body = new FormData();
        body.append('text', input.text);
        if (input.file) body.append('file', input.file);
        return api.post<StudentHomework>(`/student/homework/${encodeURIComponent(id)}/submission`, body);
      },
      async () => (await learning()).studentHomework().patch(id, { status: 'submitted', submission: { text: input.text, fileName: input.file?.name ?? null, at: new Date().toISOString() } }),
    );
  },
};

export const activityApi = createResourceService<StudentActivity, Pick<StudentActivity, 'status'>>('/student/activities', () => learning().then((m) => m.studentActivities()), {
  create: () => {
    throw new Error('read only');
  },
});

export const resultApi = createResourceService<ResultEntry, never>('/student/results', () => learning().then((m) => m.studentResults()), {
  create: () => {
    throw new Error('read only');
  },
});

export function sendAppeal(input: { result: ResultEntry; kind: 'score' | 'question'; questionNo: number | null; message: string; studentName: string; className: string }): Promise<{ id: string }> {
  return mockOr(
    () => api.post<{ id: string }>('/student/appeals', { resultId: input.result.id, kind: input.kind, questionNo: input.questionNo, message: input.message }),
    async () => {
      const { appeals } = await import('@/mocks/db/teaching');
      const id = nextId('ap');
      await appeals.insert({ id, kind: input.kind, studentName: input.studentName, className: input.className, exam: input.result.title, questionNo: input.questionNo, message: input.message, createdAt: new Date().toISOString(), status: 'open', response: '' });
      return { id };
    },
  );
}

/* ── Support work, mistakes, goals ──────────────────────────────────── */

export const supportApi = {
  /** Practice-style questions WITH answers (feedback after each question). */
  questions(item: SupportExerciseItem, signal?: AbortSignal): Promise<QuizQuestion[]> {
    return mockOr(
      () => api.get<QuizQuestion[]>(`/student/support-exercises/${encodeURIComponent(item.id)}/questions`, { signal }),
      () => practiceQuestions({ subject: item.subject, topic: item.topic, count: item.questionCount, seed: item.id.length * 77 }, signal),
    );
  },
  list(signal?: AbortSignal): Promise<SupportExerciseItem[]> {
    return mockOr(
      () => api.get<SupportExerciseItem[]>('/student/support-exercises', { signal }),
      async () => {
        const { studentSupport } = await learning();
        return mockDelay(() => studentSupport(), signal);
      },
    );
  },
  complete(id: string, result: QuizResult): Promise<SupportExerciseItem | undefined> {
    return mockOr(
      () => api.post<SupportExerciseItem>(`/student/support-exercises/${encodeURIComponent(id)}/submit`, { answers: result.answers }),
      async () => {
        const { completeStudentSupport } = await learning();
        return mockDelay(() => completeStudentSupport(id, result.percent), undefined, 400);
      },
    );
  },
  summary(topic: string, signal?: AbortSignal): Promise<string | null> {
    return mockOr(
      () => api.get<string | null>('/student/summaries', { signal, query: { topic } }),
      async () => {
        const { studentMaterials } = await learning();
        return mockDelay(() => studentMaterials().all().find((m) => m.topic === topic && m.kind === 'summary')?.body ?? null, signal, 150);
      },
    );
  },
};

export const mistakeApi = createResourceService<MistakeEntry, Pick<MistakeEntry, 'learned'>>('/student/mistakes', () => learning().then((m) => m.studentMistakes()), {
  create: () => {
    throw new Error('use saveMistakes');
  },
});

export const goalApi = createResourceService<StudentGoal, Pick<StudentGoal, 'label' | 'done'>>('/student/goals', () => learning().then((m) => m.studentGoals()), {
  create: (input) => ({ ...input, id: nextId('g') }),
});

/* ── Mock exams ─────────────────────────────────────────────────────── */

export const availableMockApi = createResourceService<AvailableMock, never>('/student/mock-exams', () => learning().then((m) => m.availableMocks()), {
  create: () => {
    throw new Error('read only');
  },
});

export const mockHistoryApi = createResourceService<MockAttempt, never>('/student/mock-exams/attempts', () => learning().then((m) => m.mockHistory()), {
  create: () => {
    throw new Error('use submitMock');
  },
});

/** Mock exam booklet. Production: GET /student/mock-exams/:id/questions, WITHOUT answers. */
export function mockQuestions(mock: AvailableMock, signal?: AbortSignal): Promise<QuizQuestion[]> {
  return mockOr(
    () => api.get<QuizQuestion[]>(`/student/mock-exams/${encodeURIComponent(mock.id)}/questions`, { signal }),
    async () => {
      const per = Math.max(1, Math.floor(mock.questionCount / mock.subjects.length));
      const parts = await Promise.all(mock.subjects.map((subject, i) => practiceQuestions({ subject, topic: null, count: i === 0 ? mock.questionCount - per * (mock.subjects.length - 1) : per, seed: 900 + i }, signal)));
      return parts.flat();
    },
  );
}

export interface MockSubmission extends QuizGrade {
  attempt: MockAttempt;
}

/** Server-graded: returns the saved attempt (nets, estimated score) and the answer key. */
export function submitMock(mock: AvailableMock, questions: QuizQuestion[], answers: (number | null)[], durationSeconds: number): Promise<MockSubmission> {
  return mockOr(
    () => api.post<MockSubmission>(`/student/mock-exams/${encodeURIComponent(mock.id)}/submit`, { answers, durationSeconds }),
    async () => {
      const { mockHistory } = await learning();
      const rule = mock.examType === 'LGS' ? 3 : 4;
      const isCorrect = (i: number) => answers[i] !== null && answers[i] !== undefined && answers[i] === questions[i].answer;
      const isWrong = (i: number) => answers[i] !== null && answers[i] !== undefined && answers[i] !== questions[i].answer;
      const bySubject = mock.subjects.map((subject) => {
        const idx = questions.map((q, i) => (q.subject === subject ? i : -1)).filter((i) => i >= 0);
        const correct = idx.filter(isCorrect).length;
        const wrong = idx.filter(isWrong).length;
        return { subject, total: idx.length, net: Math.round((correct - wrong / rule) * 100) / 100 };
      });
      const all = questions.map((_, i) => i);
      const correct = all.filter(isCorrect).length;
      const wrong = all.filter(isWrong).length;
      const net = Math.round((correct - wrong / rule) * 100) / 100;
      const total = questions.length || 1;
      const attempt = await mockHistory().insert({
        id: nextId('att'),
        examType: mock.examType,
        title: mock.title,
        date: new Date().toISOString(),
        correct,
        wrong,
        blank: questions.length - correct - wrong,
        net,
        score: mock.examType === 'LGS' ? Math.round(300 + (net / total) * 200) : Math.round(220 + (net / total) * 260),
        bySubject,
      });
      return { attempt, answerKey: questions.map((q) => q.answer ?? -1), explanations: questions.map((q) => q.explanation ?? null) };
    },
  );
}

/* ── Guidance ───────────────────────────────────────────────────────── */

export const interestApi = {
  get(signal?: AbortSignal): Promise<InterestProfile> {
    return mockOr(
      () => api.get<InterestProfile>('/student/guidance/interests', { signal }),
      async () => {
        const { interestStore } = await learning();
        return mockDelay(() => structuredClone(interestStore().value), signal);
      },
    );
  },
  save(value: InterestProfile): Promise<InterestProfile> {
    return mockOr(
      () => api.put<InterestProfile>('/student/guidance/interests', value),
      async () => {
        const { interestStore } = await learning();
        return mockDelay(() => {
          interestStore().value = { ...structuredClone(value), updatedAt: new Date().toISOString() };
          return structuredClone(interestStore().value);
        }, undefined, 450);
      },
    );
  },
};

/** Programme suggestions computed on the server from the saved interest profile (rule-based score). */
export function majorSuggestions(signal?: AbortSignal): Promise<MajorSuggestion[]> {
  return mockOr(
    () => api.get<MajorSuggestion[]>('/student/guidance/major-suggestions', { signal }),
    async () => {
      const [{ interestStore }, { majorSuggestions: suggest }] = await Promise.all([learning(), guidance()]);
      return mockDelay(() => suggest(interestStore().value), signal, 300);
    },
  );
}

export const schoolSearchApi = createResourceService<HighSchool, never>('/student/guidance/schools', () => guidance().then((m) => m.schools), {
  create: () => {
    throw new Error('read only');
  },
});

export const programSearchApi = createResourceService<UniversityProgram, never>('/student/guidance/programs', () => guidance().then((m) => m.programs), {
  create: () => {
    throw new Error('read only');
  },
});

export const careerSearchApi = createResourceService<Career, never>('/student/guidance/careers', () => guidance().then((m) => m.careers), {
  create: () => {
    throw new Error('read only');
  },
});

export const roadmapApi = createResourceService<RoadmapStep, Omit<RoadmapStep, 'id'>>('/student/guidance/roadmap', () => learning().then((m) => m.roadmap()), {
  create: (input) => ({ ...input, id: nextId('rm') }),
});

export const savedApi = {
  ...createResourceService<SavedChoice, Omit<SavedChoice, 'id'>>('/student/guidance/saved', () => learning().then((m) => m.savedChoices()), {
    create: (input) => ({ ...input, id: nextId('sv') }),
  }),
  /** Persist a new order in one call (ids in the desired order). */
  reorder(ids: string[]): Promise<void> {
    return mockOr(
      () => api.put<void>('/student/guidance/saved/order', { ids }),
      async () => {
        const store = (await learning()).savedChoices();
        await Promise.all(ids.map((id, i) => store.patch(id, { order: i + 1 })));
      },
    );
  },
};
