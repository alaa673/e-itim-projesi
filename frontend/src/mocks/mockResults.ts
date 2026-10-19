import type { ExamResult, ExamSummary, Locale, Topic } from '@/types';
import { fullName, rosterOf } from './mockStudents';
import { clamp, createRandom, l, relativeDate } from './utils';

interface TopicSeed {
  id: string;
  tr: string;
  en: string;
  /** Difficulty offset applied to every student's ability. */
  offset: number;
}

interface ExamSeed {
  id: string;
  classId: string;
  className: string;
  titleTr: string;
  titleEn: string;
  daysAgo: number;
  studentCount: number;
  questionsPerTopic: number;
  seed: number;
  topics: TopicSeed[];
}

const GRADE8_TOPICS: TopicSeed[] = [
  { id: 't-fractions', tr: 'Kesirler', en: 'Fractions', offset: -0.21 },
  { id: 't-equations', tr: 'Denklemler', en: 'Equations', offset: 0.13 },
  { id: 't-ratio', tr: 'Oran ve Orantı', en: 'Ratio & proportion', offset: 0.02 },
  { id: 't-exponents', tr: 'Üslü İfadeler', en: 'Exponents', offset: -0.1 },
  { id: 't-geometry', tr: 'Geometri', en: 'Geometry', offset: -0.04 },
  { id: 't-data', tr: 'Veri Analizi', en: 'Data analysis', offset: 0.1 },
];

const GRADE7_TOPICS: TopicSeed[] = [
  { id: 't-integers', tr: 'Tam Sayılar', en: 'Integers', offset: 0.08 },
  { id: 't-rationals', tr: 'Rasyonel Sayılar', en: 'Rational numbers', offset: -0.2 },
  { id: 't-algebra', tr: 'Cebirsel İfadeler', en: 'Algebraic expressions', offset: -0.06 },
  { id: 't-percent', tr: 'Yüzdeler', en: 'Percentages', offset: 0.04 },
  { id: 't-ratio7', tr: 'Oran ve Orantı', en: 'Ratio & proportion', offset: 0.1 },
];

export const EXAM_SEEDS: ExamSeed[] = [
  {
    id: 'exam-8a-u2', classId: 'class-8a', className: '8-A', titleTr: '2. Ünite Değerlendirme', titleEn: 'Unit 2 assessment',
    daysAgo: 3, studentCount: 32, questionsPerTopic: 6, seed: 801, topics: GRADE8_TOPICS,
  },
  {
    id: 'exam-8b-u2', classId: 'class-8b', className: '8-B', titleTr: '2. Ünite Değerlendirme', titleEn: 'Unit 2 assessment',
    daysAgo: 2, studentCount: 28, questionsPerTopic: 6, seed: 802, topics: GRADE8_TOPICS,
  },
  {
    id: 'exam-7a-q3', classId: 'class-7a', className: '7-A', titleTr: 'Sayılar Quiz 3', titleEn: 'Numbers quiz 3',
    daysAgo: 6, studentCount: 30, questionsPerTopic: 4, seed: 701, topics: GRADE7_TOPICS,
  },
];

function toSummary(seed: ExamSeed, locale: Locale): ExamSummary {
  const topics: Topic[] = seed.topics.map((t) => ({ id: t.id, name: l(locale, t.tr, t.en) }));
  return {
    id: seed.id,
    title: l(locale, seed.titleTr, seed.titleEn),
    classId: seed.classId,
    className: seed.className,
    subject: l(locale, 'Matematik', 'Mathematics'),
    date: relativeDate(-seed.daysAgo, 10, 30),
    questionCount: seed.questionsPerTopic * seed.topics.length,
    topics,
  };
}

function generateResults(seed: ExamSeed): ExamResult[] {
  const random = createRandom(seed.seed);
  const results: ExamResult[] = [];
  const roster = rosterOf(seed.className);
  const notCompletedIndexes = new Set([7, 19, 26].filter((i) => i < roster.length));

  for (let i = 0; i < roster.length; i += 1) {
    const student = roster[i];
    const name = fullName(student);
    // Approximate normal distribution for ability (sum of uniforms).
    const ability = name === 'Deniz Kaya' ? 0.6 : clamp(0.42 + (random() + random() + random()) * 0.15, 0.32, 0.97);
    const completed = !notCompletedIndexes.has(i);
    let correct = 0;
    let wrong = 0;
    let blank = 0;

    const topics = seed.topics.map((topic) => {
      const p = clamp(ability + topic.offset + (random() - 0.5) * 0.18, 0.1, 0.98);
      let topicCorrect = 0;
      for (let q = 0; q < seed.questionsPerTopic; q += 1) {
        if (!completed) continue;
        if (random() < p) topicCorrect += 1;
        else if (random() < 0.75) wrong += 1;
        else blank += 1;
      }
      correct += topicCorrect;
      return {
        topicId: topic.id,
        correct: topicCorrect,
        total: seed.questionsPerTopic,
        percent: Math.round((topicCorrect / seed.questionsPerTopic) * 100),
      };
    });

    const totalQuestions = seed.questionsPerTopic * seed.topics.length;
    results.push({
      studentId: student.id,
      studentName: name,
      schoolNumber: student.schoolNumber,
      completed,
      score: completed ? Math.round((correct / totalQuestions) * 100) : null,
      correct,
      wrong,
      blank,
      topics: completed ? topics : [],
    });
  }
  return results;
}

const resultCache = new Map<string, ExamResult[]>();

export function getExamSeed(examId: string): ExamSeed | undefined {
  return EXAM_SEEDS.find((e) => e.id === examId);
}

export function getExamResults(examId: string): ExamResult[] {
  const seed = getExamSeed(examId);
  if (!seed) return [];
  if (!resultCache.has(examId)) resultCache.set(examId, generateResults(seed));
  return resultCache.get(examId) ?? [];
}

export function getExamSummary(examId: string, locale: Locale): ExamSummary | undefined {
  const seed = getExamSeed(examId);
  return seed ? toSummary(seed, locale) : undefined;
}

export function listExamSummaries(locale: Locale): ExamSummary[] {
  return EXAM_SEEDS.map((seed) => toSummary(seed, locale));
}
