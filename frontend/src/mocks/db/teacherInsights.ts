/**
 * Class and student analytics for the demo teacher (Ayşe Yılmaz). Classes with a seeded exam use the
 * real per-student results from mockResults; the others get deterministic synthetic figures.
 * DEVELOPMENT-ONLY demo data.
 */
import type { Student } from '@/types';
import { compareText, createCollection } from '../collection';
import { EXAM_SEEDS, getExamResults } from '../mockResults';
import { fullName, rosterOf } from '../mockStudents';
import { clamp, createRandom, relativeDate } from '../utils';
import { DEMO_TEACHER_CLASSES } from './core';
import { sentSupport } from './teaching';
import type { TeachingScope, TopicPercent, TeacherStudentRow, TeacherClassRow } from '@/features/teacher/types';

const SYNTH_TOPICS: Record<string, string[]> = {
  '7': ['Tam Sayılar', 'Rasyonel Sayılar', 'Cebirsel İfadeler', 'Yüzdeler', 'Oran ve Orantı'],
  '6': ['Doğal Sayılar', 'Kesirler', 'Ondalık Gösterim', 'Alan Ölçme', 'Veri Analizi'],
  '5': ['Doğal Sayılar', 'Kesirler', 'Geometrik Şekiller', 'Uzunluk Ölçme', 'Veri Analizi'],
};

function rowsForClass(className: string): TeacherStudentRow[] {
  const seed = EXAM_SEEDS.find((e) => e.className === className);
  const roster: Student[] = rosterOf(className);
  const supportByName = new Map(sentSupport.all().map((s) => [s.studentName, s.status] as const));
  const random = createRandom(className.charCodeAt(0) * 97 + className.charCodeAt(2));
  if (seed) {
    const results = getExamResults(seed.id);
    return roster.map((s) => {
      const r = results.find((x) => x.studentId === s.id);
      const topics = (r?.topics ?? []).map((tp) => ({ name: seed.topics.find((x) => x.id === tp.topicId)?.tr ?? tp.topicId, percent: tp.percent }));
      const base = r?.score ?? Math.round(50 + random() * 30);
      const prev = clamp(Math.round(base + (random() - 0.55) * 18), 10, 100);
      const weak = topics.length ? topics.reduce((a, b) => (b.percent < a.percent ? b : a)) : null;
      const name = fullName(s);
      return {
        id: s.id,
        name,
        className,
        schoolNumber: s.schoolNumber,
        average: Math.round((base * 2 + prev) / 3),
        lastScore: r?.score ?? null,
        trend: r?.score !== null && r?.score !== undefined ? r.score - prev : 0,
        weakTopic: weak,
        topics,
        recent: [
          { title: 'Quiz 1', date: relativeDate(-30, 10, 0), score: clamp(prev - 6, 0, 100) },
          { title: 'Quiz 2', date: relativeDate(-17, 10, 0), score: prev },
          ...(r?.score !== null && r?.score !== undefined ? [{ title: seed.titleTr, date: relativeDate(-seed.daysAgo, 10, 30), score: r.score }] : []),
        ],
        support: supportByName.get(name) ?? 'none',
      };
    });
  }
  const topicsNames = SYNTH_TOPICS[className.split('-')[0]] ?? SYNTH_TOPICS['7'];
  return roster.map((s) => {
    const ability = clamp(0.45 + (random() + random() + random()) * 0.15, 0.3, 0.97);
    const topics = topicsNames.map((name, i) => ({ name, percent: Math.round(clamp(ability + ((i * 37) % 11) / 50 - 0.1 + (random() - 0.5) * 0.2, 0.1, 1) * 100) }));
    const score = Math.round(topics.reduce((a, b) => a + b.percent, 0) / topics.length);
    const prev = clamp(Math.round(score + (random() - 0.5) * 16), 10, 100);
    const name = fullName(s);
    return {
      id: s.id,
      name,
      className,
      schoolNumber: s.schoolNumber,
      average: Math.round((score + prev) / 2),
      lastScore: score,
      trend: score - prev,
      weakTopic: topics.reduce((a, b) => (b.percent < a.percent ? b : a)),
      topics,
      recent: [
        { title: 'Quiz 1', date: relativeDate(-28, 10, 0), score: prev },
        { title: 'Quiz 2', date: relativeDate(-9, 10, 0), score },
      ],
      support: supportByName.get(name) ?? 'none',
    };
  });
}

let cache: TeacherStudentRow[] | null = null;
function allRows(): TeacherStudentRow[] {
  return (cache ??= DEMO_TEACHER_CLASSES.flatMap(rowsForClass));
}

export const teacherStudents = createCollection<TeacherStudentRow>(allRows, {
  searchText: (r) => `${r.name} ${r.schoolNumber} ${r.className}`,
  filter: (r, key, value) => (key === 'needsSupport' ? (value === 'yes' ? (r.weakTopic?.percent ?? 100) < 50 : true) : String((r as unknown as Record<string, unknown>)[key]) === value),
  sorters: {
    name: (a, b) => compareText(a.name, b.name),
    average: (a, b) => a.average - b.average,
    className: (a, b) => compareText(a.className, b.className) || compareText(a.name, b.name),
  },
  defaultSort: 'name',
});

export function teacherClassRows(): TeacherClassRow[] {
  return DEMO_TEACHER_CLASSES.map((name) => {
    const rows = teacherStudents.all().filter((r) => r.className === name);
    const seed = EXAM_SEEDS.find((e) => e.className === name);
    const topicNames = [...new Set(rows.flatMap((r) => r.topics.map((t) => t.name)))];
    const topics = topicNames.map((tn) => {
      const values = rows.flatMap((r) => r.topics.filter((t) => t.name === tn).map((t) => t.percent));
      return { name: tn, percent: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0 };
    });
    const scored = rows.filter((r) => r.lastScore !== null);
    const avg = scored.length ? Math.round(scored.reduce((a, r) => a + (r.lastScore ?? 0), 0) / scored.length) : 0;
    return {
      id: `class-${name.toLowerCase().replace('-', '')}`,
      name,
      grade: Number(name.split('-')[0]),
      subject: 'Matematik',
      studentCount: rows.length,
      average: avg,
      lastExam: seed ? { id: seed.id, title: seed.titleTr, date: relativeDate(-seed.daysAgo, 10, 30), average: avg } : { id: '', title: 'Quiz 2', date: relativeDate(-9, 10, 0), average: avg },
      topics: topics.sort((a, b) => a.percent - b.percent),
      needsSupport: rows.filter((r) => (r.weakTopic?.percent ?? 100) < 50).length,
    };
  });
}

/** Demo curriculum: the demo teacher teaches mathematics. */
function demoTopics(className: string): string[] {
  const grade = className.split('-')[0];
  if (grade === '8') return ['Kesirler', 'Denklemler', 'Oran ve Orantı', 'Üslü İfadeler', 'Kareköklü İfadeler', 'Geometri', 'Veri Analizi', 'Olasılık'];
  if (grade === '7') return ['Tam Sayılar', 'Rasyonel Sayılar', 'Cebirsel İfadeler', 'Eşitsizlikler', 'Yüzdeler', 'Oran ve Orantı'];
  if (grade === '6') return ['Doğal Sayılar', 'Çarpanlar ve Katlar', 'Kesirler', 'Ondalık Gösterim', 'Alan Ölçme', 'Veri Analizi'];
  return ['Doğal Sayılar', 'Kesirler', 'Geometrik Şekiller', 'Uzunluk Ölçme', 'Veri Analizi'];
}

export function teachingScope(): TeachingScope {
  const classes = DEMO_TEACHER_CLASSES.map((name) => ({
    name,
    grade: Number(name.split('-')[0]),
    subject: 'Matematik',
    studentCount: teacherStudents.all().filter((r) => r.className === name).length,
  }));
  return { classes, topicsByClass: Object.fromEntries(classes.map((c) => [c.name, demoTopics(c.name)])) };
}

/** Refresh support state after the teacher sends an exercise. */
export function markSupportSent(studentName: string) {
  const row = teacherStudents.all().find((r) => r.name === studentName);
  if (row) teacherStudents.mutate(row.id, (r) => ({ ...r, support: 'pending' }));
}

export type { TopicPercent, TeacherStudentRow, TeacherClassRow };
