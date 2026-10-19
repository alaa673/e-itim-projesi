/**
 * Academic backbone of the demo school: classes, teachers, terms and teacher assignments.
 * DEVELOPMENT-ONLY data used by the mock adapters.
 */
import type { SchoolClass, Teacher, TeacherAssignment, Term } from '@/types';
import { createCollection, compareText } from '../collection';
import { CLASS_LAYOUT, mockStudentTable } from '../mockStudents';
import { asciiSlug, createRandom, FIRST_NAMES, LAST_NAMES, pick, relativeDate } from '../utils';
import { SUBJECT_SEEDS, subjectsFor } from './catalog';

export const DEMO_TEACHER_ID = 'u-teacher-1';
export const DEMO_TEACHER_NAME = 'Ayşe Yılmaz';
/** Classes taught by the demo teacher (Matematik). */
export const DEMO_TEACHER_CLASSES = ['8-A', '8-B', '7-A', '7-C', '6-B', '5-A'];

const BRANCH_PLAN: { branch: string; count: number }[] = [
  { branch: 'Matematik', count: 7 },
  { branch: 'Türkçe', count: 4 },
  { branch: 'Fen Bilimleri', count: 4 },
  { branch: 'İngilizce', count: 5 },
  { branch: 'Sosyal Bilgiler', count: 2 },
  { branch: 'Sınıf Öğretmenliği', count: 4 },
  { branch: 'Fizik', count: 3 },
  { branch: 'Kimya', count: 3 },
  { branch: 'Biyoloji', count: 3 },
  { branch: 'Türk Dili ve Edebiyatı', count: 4 },
  { branch: 'Tarih', count: 2 },
  { branch: 'Coğrafya', count: 2 },
  { branch: 'Din Kültürü ve Ahlak Bilgisi', count: 2 },
  { branch: 'Rehberlik', count: 2 },
];

function seedTeachers(): Teacher[] {
  const random = createRandom(4601);
  const list: Teacher[] = [];
  const used = new Set<string>([DEMO_TEACHER_NAME]);
  list.push({
    id: DEMO_TEACHER_ID, firstName: 'Ayşe', lastName: 'Yılmaz', email: 'ogretmen@demo.okul', phone: '0532 410 22 18',
    branch: 'Matematik', classIds: DEMO_TEACHER_CLASSES.map(classIdOf), status: 'active', joinedAt: '2019-09-02T08:00:00.000Z',
  });
  let n = 2;
  for (const { branch, count } of BRANCH_PLAN) {
    for (let i = 0; i < (branch === 'Matematik' ? count - 1 : count); i += 1) {
      let firstName = '';
      let lastName = '';
      do {
        firstName = pick(random, FIRST_NAMES);
        lastName = pick(random, LAST_NAMES);
      } while (used.has(`${firstName} ${lastName}`));
      used.add(`${firstName} ${lastName}`);
      list.push({
        id: `tch-${String(n).padStart(3, '0')}`,
        firstName,
        lastName,
        email: `${asciiSlug(firstName)}.${asciiSlug(lastName)}@demo.okul`,
        phone: `05${30 + Math.floor(random() * 9)} ${100 + Math.floor(random() * 899)} ${10 + Math.floor(random() * 89)} ${10 + Math.floor(random() * 89)}`,
        branch,
        classIds: [],
        status: random() < 0.07 ? 'inactive' : 'active',
        joinedAt: new Date(Date.UTC(2014 + Math.floor(random() * 12), 8, 1 + Math.floor(random() * 25))).toISOString(),
      });
      n += 1;
    }
  }
  return list;
}

export function classIdOf(name: string): string {
  return `class-${name.toLowerCase().replace('-', '')}`;
}

export const teachers = createCollection<Teacher>(seedTeachers, {
  searchText: (t) => `${t.firstName} ${t.lastName} ${t.email} ${t.branch}`,
  sorters: {
    name: (a, b) => compareText(`${a.firstName} ${a.lastName}`, `${b.firstName} ${b.lastName}`),
    branch: (a, b) => compareText(a.branch, b.branch),
    joinedAt: (a, b) => a.joinedAt.localeCompare(b.joinedAt),
  },
  defaultSort: 'name',
});

export function teacherName(id: string | null): string | null {
  if (!id) return null;
  const t = teachers.find(id);
  return t ? `${t.firstName} ${t.lastName}` : null;
}

function seedClasses(): SchoolClass[] {
  const homerooms = teachers.all().filter((t) => t.status === 'active');
  const list: SchoolClass[] = [];
  let i = 0;
  for (const { level, grade, sections } of CLASS_LAYOUT) {
    for (const section of sections) {
      const name = `${grade}-${section}`;
      const homeroom = name === '8-A' ? teachers.find(DEMO_TEACHER_ID)! : homerooms[(i * 5) % homerooms.length];
      list.push({
        id: classIdOf(name),
        name,
        level,
        grade,
        section,
        homeroomTeacherId: homeroom.id,
        homeroomTeacher: `${homeroom.firstName} ${homeroom.lastName}`,
        studentCount: mockStudentTable.filter((s) => s.grade === grade && s.section === section && s.status !== 'archived').length,
        capacity: 36,
        room: `${level === 'primary' ? 'A' : level === 'middle' ? 'B' : 'C'}-${100 + i}`,
        status: 'active',
      });
      i += 1;
    }
  }
  return list;
}

export const classes = createCollection<SchoolClass>(seedClasses, {
  searchText: (c) => `${c.name} ${c.homeroomTeacher ?? ''} ${c.room}`,
  sorters: {
    name: (a, b) => a.grade - b.grade || compareText(a.section, b.section),
    studentCount: (a, b) => a.studentCount - b.studentCount,
  },
  defaultSort: 'name',
});

function seedTerms(): Term[] {
  return [
    { id: 'term-2627-1', year: '2026–2027', name: 'Güz Dönemi', start: '2026-09-07', end: '2027-01-22', status: 'current' },
    { id: 'term-2627-2', year: '2026–2027', name: 'Bahar Dönemi', start: '2027-02-08', end: '2027-06-25', status: 'upcoming' },
    { id: 'term-2526-2', year: '2025–2026', name: 'Bahar Dönemi', start: '2026-02-02', end: '2026-06-26', status: 'archived' },
    { id: 'term-2526-1', year: '2025–2026', name: 'Güz Dönemi', start: '2025-09-08', end: '2026-01-16', status: 'archived' },
    { id: 'term-2425-2', year: '2024–2025', name: 'Bahar Dönemi', start: '2025-02-03', end: '2025-06-20', status: 'archived' },
  ];
}

export const terms = createCollection<Term>(seedTerms, {
  searchText: (t) => `${t.year} ${t.name}`,
  sorters: { start: (a, b) => a.start.localeCompare(b.start) },
  defaultSort: 'start',
});

const BRANCH_OF_SUBJECT: Record<string, string> = {
  Matematik: 'Matematik', 'Fen Bilimleri': 'Fen Bilimleri', Türkçe: 'Türkçe', 'T.C. İnkılap Tarihi ve Atatürkçülük': 'Sosyal Bilgiler',
  İngilizce: 'İngilizce', 'Sosyal Bilgiler': 'Sosyal Bilgiler', 'Din Kültürü ve Ahlak Bilgisi': 'Din Kültürü ve Ahlak Bilgisi',
  Fizik: 'Fizik', Kimya: 'Kimya', Biyoloji: 'Biyoloji', 'Türk Dili ve Edebiyatı': 'Türk Dili ve Edebiyatı', Tarih: 'Tarih', Coğrafya: 'Coğrafya',
};

function seedAssignments(): TeacherAssignment[] {
  const random = createRandom(9901);
  const list: TeacherAssignment[] = [];
  const pool = (branch: string) => teachers.all().filter((t) => t.branch === branch && t.status === 'active' && t.id !== DEMO_TEACHER_ID);
  const primaryTeachers = pool('Sınıf Öğretmenliği');
  for (const cls of classes.all()) {
    for (const subject of subjectsFor(cls.level, cls.grade)) {
      let teacher = null as ReturnType<typeof teachers.find> | null;
      if (subject.name === 'Matematik' && DEMO_TEACHER_CLASSES.includes(cls.name)) teacher = teachers.find(DEMO_TEACHER_ID) ?? null;
      else if (cls.level === 'primary' && ['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler'].includes(subject.name)) teacher = primaryTeachers[(cls.grade * 2 + cls.section.charCodeAt(0)) % primaryTeachers.length];
      else {
        const candidates = pool(BRANCH_OF_SUBJECT[subject.name] ?? subject.name);
        teacher = candidates.length && random() > 0.04 ? pick(random, candidates) : null;
      }
      list.push({
        id: `asg-${cls.id}-${subject.id}`,
        classId: cls.id,
        className: cls.name,
        subjectId: subject.id,
        subjectName: subject.name,
        teacherId: teacher?.id ?? null,
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : null,
        weeklyHours: subject.weeklyHours,
        status: teacher ? 'assigned' : 'pending',
      });
    }
  }
  return list;
}

export const assignments = createCollection<TeacherAssignment>(seedAssignments, {
  searchText: (a) => `${a.className} ${a.subjectName} ${a.teacherName ?? ''}`,
  filter: (a, key, value) => {
    if (key === 'level') return classes.find(a.classId)?.level === value;
    return String((a as unknown as Record<string, unknown>)[key]) === value;
  },
  sorters: {
    className: (a, b) => (classes.find(a.classId)?.grade ?? 0) - (classes.find(b.classId)?.grade ?? 0) || compareText(a.className, b.className) || compareText(a.subjectName, b.subjectName),
    subjectName: (a, b) => compareText(a.subjectName, b.subjectName),
    teacherName: (a, b) => compareText(a.teacherName ?? 'ü', b.teacherName ?? 'ü'),
  },
  defaultSort: 'className',
});

export const subjects = createCollection(() => structuredClone(SUBJECT_SEEDS), {
  searchText: (s) => `${s.name} ${s.units.map((u) => `${u.name} ${u.topics.map((t) => t.name).join(' ')}`).join(' ')}`,
  filter: (s, key, value) => (key === 'level' ? s.levels.includes(value as never) : String((s as unknown as Record<string, unknown>)[key]) === value),
  sorters: { name: (a, b) => compareText(a.name, b.name) },
  defaultSort: 'name',
});

export { relativeDate };

let teacherClassesSynced = false;
/** Fills Teacher.classIds from the assignment table (once, after both are seeded). */
export function syncTeacherClasses(): void {
  if (teacherClassesSynced) return;
  teacherClassesSynced = true;
  const byTeacher = new Map<string, Set<string>>();
  for (const a of assignments.all()) {
    if (!a.teacherId) continue;
    if (!byTeacher.has(a.teacherId)) byTeacher.set(a.teacherId, new Set());
    byTeacher.get(a.teacherId)!.add(a.classId);
  }
  for (const t of teachers.all()) teachers.mutate(t.id, (x) => ({ ...x, classIds: [...(byTeacher.get(t.id) ?? [])] }));
}
