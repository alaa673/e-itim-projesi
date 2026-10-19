import { TOPIC_REVIEW_THRESHOLD } from '@/config/constants';
import type {
  ExamAnalysis,
  ResultListFilters,
  StudentNeedingSupport,
  TeacherDashboardData,
} from '@/features/teacher/types';
import type { ExamResult, ExamSummary, Locale, PaginatedResponse, PaginationParams, SupportExerciseRequest } from '@/types';
import { ApiError } from '@/utils/errorHandling';
import { getExamResults, getExamSummary, listExamSummaries } from '../mockResults';
import { rosterOf } from '../mockStudents';
import { calendarOf } from '../db/comms';
import { classIdOf } from '../db/core';
import { appeals, classExams, mockExams, sentSupport, submissions, TEACHER_CLASS_NAMES } from '../db/teaching';
import { l, mockDelay } from '../utils';

const collator = new Intl.Collator('tr', { sensitivity: 'base' });

function average(values: number[]): number {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
}

function buildAnalysis(examId: string, locale: Locale): ExamAnalysis {
  const exam = getExamSummary(examId, locale);
  if (!exam) throw new ApiError('not_found', { status: 404 });
  const results = getExamResults(examId);
  const done = results.filter((r) => r.completed);
  const scores = done.map((r) => r.score ?? 0);

  return {
    exam,
    assigned: results.length,
    completed: done.length,
    average: average(scores),
    highest: Math.max(...scores),
    lowest: Math.min(...scores),
    topicAverages: exam.topics.map((topic) => {
      const values = done.map((r) => r.topics.find((t) => t.topicId === topic.id)?.percent ?? 0);
      return {
        topicId: topic.id,
        name: topic.name,
        percent: average(values),
        belowThreshold: values.filter((v) => v < TOPIC_REVIEW_THRESHOLD).length,
      };
    }),
    notCompleted: results.filter((r) => !r.completed).map((r) => ({ studentId: r.studentId, studentName: r.studentName })),
  };
}

export function listTeacherExamsMock(locale: Locale, signal?: AbortSignal): Promise<ExamSummary[]> {
  return mockDelay(() => listExamSummaries(locale), signal, 200);
}

export function getExamAnalysisMock(examId: string, locale: Locale, signal?: AbortSignal): Promise<ExamAnalysis> {
  return mockDelay(() => buildAnalysis(examId, locale), signal);
}

export function listExamResultsMock(
  examId: string,
  filters: ResultListFilters,
  page: PaginationParams,
  signal?: AbortSignal,
): Promise<PaginatedResponse<ExamResult>> {
  return mockDelay(() => {
    const term = filters.search.trim().toLocaleLowerCase('tr-TR');
    const filtered = getExamResults(examId)
      .filter((r) => !term || `${r.studentName} ${r.schoolNumber}`.toLocaleLowerCase('tr-TR').includes(term))
      .filter((r) => {
        if (!filters.weakTopicId) return true;
        const topic = r.topics.find((t) => t.topicId === filters.weakTopicId);
        return Boolean(topic && topic.percent < TOPIC_REVIEW_THRESHOLD);
      })
      .sort((a, b) => {
        let result =
          filters.sortKey === 'name'
            ? collator.compare(a.studentName, b.studentName)
            : (a.score ?? -1) - (b.score ?? -1);
        if (result === 0) result = a.studentId.localeCompare(b.studentId);
        return filters.sortDirection === 'desc' ? -result : result;
      });
    return {
      items: filtered.slice(page.offset, page.offset + page.limit),
      total: filtered.length,
      offset: page.offset,
      limit: page.limit,
    };
  }, signal);
}

export function sendSupportExerciseMock(request: SupportExerciseRequest): Promise<{ id: string }> {
  return mockDelay(() => {
    if (request.questionCount < 1) throw new ApiError('validation', { status: 422 });
    const id = `support-${Date.now()}`;
    sentSupport.all().unshift({
      id,
      studentName: request.studentName ?? request.studentId,
      className: request.className ?? '',
      topic: request.topicName ?? request.topicId,
      difficulty: request.difficulty,
      questionCount: request.questionCount,
      includeSummary: request.includeSummary,
      sentAt: new Date().toISOString(),
      due: request.dueDate ? new Date(`${request.dueDate}T23:59:00`).toISOString() : null,
      status: 'pending',
      before: request.percent ?? 0,
      after: null,
    });
    if (request.studentName) void import('../db/teacherInsights').then((m) => m.markSupportSent(request.studentName ?? ''));
    return { id };
  }, undefined, 700);
}

function weakestStudents(examId: string, locale: Locale): StudentNeedingSupport[] {
  const exam = getExamSummary(examId, locale);
  if (!exam) return [];
  return getExamResults(examId)
    .filter((r) => r.completed)
    .map((r) => {
      const weakest = [...r.topics].sort((a, b) => a.percent - b.percent)[0];
      const topic = exam.topics.find((t) => t.id === weakest.topicId);
      return {
        studentId: r.studentId,
        studentName: r.studentName,
        className: exam.className,
        examId,
        topicId: weakest.topicId,
        topicName: topic?.name ?? '',
        percent: weakest.percent,
      };
    })
    .sort((a, b) => a.percent - b.percent);
}

const FEATURED = ['Deniz Kaya', 'Ece Demir', 'Mert Arslan'];

export function getTeacherDashboardMock(locale: Locale, signal?: AbortSignal): Promise<TeacherDashboardData> {
  return mockDelay(() => {
    const weak = [...weakestStudents('exam-8a-u2', locale), ...weakestStudents('exam-8b-u2', locale)].filter((s) => s.percent < 60);
    const featured = FEATURED.map((name) => weak.find((w) => w.studentName === name)).filter((w): w is StudentNeedingSupport => Boolean(w));
    const rest = weak.filter((w) => !FEATURED.includes(w.studentName));
    const today = new Date().toDateString();
    const schedule = calendarOf('teacher')
      .all()
      .filter((e) => new Date(e.start).toDateString() === today)
      .sort((a, b) => a.start.localeCompare(b.start));
    const latest = classExams.find('ce-4');
    const classCards = TEACHER_CLASS_NAMES.map((name) => {
      const examId = { '8-A': 'exam-8a-u2', '8-B': 'exam-8b-u2', '7-A': 'exam-7a-q3' }[name];
      const average = examId ? buildAnalysis(examId, locale).average : 60 + (name.charCodeAt(2) % 12);
      return { id: classIdOf(name), name, subject: l(locale, 'Matematik', 'Mathematics'), studentCount: rosterOf(name).length, average };
    });
    return {
      stats: {
        classes: TEACHER_CLASS_NAMES.length,
        students: TEACHER_CLASS_NAMES.reduce((sum, n) => sum + rosterOf(n).length, 0),
        activeExams: classExams.all().filter((e) => e.status === 'active' || e.status === 'scheduled').length + mockExams.all().filter((m) => m.status === 'scheduled').length,
        pendingReviews: submissions.all().filter((s) => s.status === 'pending').length + appeals.all().filter((a) => a.status === 'open').length,
      },
      needsSupport: [...featured, ...rest].slice(0, 6),
      schedule: schedule.map((e) => ({ id: e.id, start: e.start, end: e.end, classLabel: e.classLabel, title: e.title, kind: e.kind })),
      classes: classCards,
      latestExam: latest
        ? { id: latest.id, title: latest.title, className: latest.classNames.join(', '), completed: latest.completed, assigned: latest.assigned, average: latest.average ?? 0, questionCount: 10, date: latest.date }
        : null,
    };
  }, signal);
}
