import type { RecordStatus, SchoolLevel, Student } from '@/types';
import { asciiSlug, createRandom, FIRST_NAMES, LAST_NAMES, pick } from './utils';

/** The school's sections: primary 1–4 (A–B), middle 5–8 (A–C), high 9–12 (A–D) → 36 classes. */
export const CLASS_LAYOUT: { level: SchoolLevel; grade: number; sections: string[] }[] = [
  ...[1, 2, 3, 4].map((grade) => ({ level: 'primary' as const, grade, sections: ['A', 'B'] })),
  ...[5, 6, 7, 8].map((grade) => ({ level: 'middle' as const, grade, sections: ['A', 'B', 'C'] })),
  ...[9, 10, 11, 12].map((grade) => ({ level: 'high' as const, grade, sections: ['A', 'B', 'C', 'D'] })),
];

/** People who appear by name in the PUSULA mockups, placed in fixed classes. */
const FIXED: { firstName: string; lastName: string; grade: number; section: string }[] = [
  { firstName: 'Deniz', lastName: 'Kaya', grade: 8, section: 'A' },
  { firstName: 'Mert', lastName: 'Arslan', grade: 8, section: 'A' },
  { firstName: 'Ece', lastName: 'Demir', grade: 8, section: 'B' },
  { firstName: 'Elif', lastName: 'Yıldız', grade: 11, section: 'B' },
];

function generateStudents(): Student[] {
  const random = createRandom(20261014);
  const usedEmails = new Set<string>();
  const usedNames = new Set<string>();
  const students: Student[] = [];
  let index = 0;

  const add = (firstName: string, lastName: string, level: SchoolLevel, grade: number, section: string, status: RecordStatus) => {
    let email = `${asciiSlug(firstName)}.${asciiSlug(lastName)}@ogrenci.demo.okul`;
    let suffix = 2;
    while (usedEmails.has(email)) {
      email = `${asciiSlug(firstName)}.${asciiSlug(lastName)}${suffix}@ogrenci.demo.okul`;
      suffix += 1;
    }
    usedEmails.add(email);
    usedNames.add(`${firstName} ${lastName}`);
    const yearsAgo = Math.min(grade - 1, Math.floor(random() * 4));
    const enrolled = new Date(Date.UTC(2026 - yearsAgo, 8, 1 + Math.floor(random() * 20)));
    index += 1;
    students.push({
      id: `stu-${String(index).padStart(4, '0')}`,
      schoolNumber: String(1003 + index * 7),
      firstName,
      lastName,
      email,
      level,
      grade,
      section,
      status,
      enrolledAt: enrolled.toISOString(),
    });
  };

  for (const { level, grade, sections } of CLASS_LAYOUT) {
    for (const section of sections) {
      for (const f of FIXED.filter((p) => p.grade === grade && p.section === section)) add(f.firstName, f.lastName, level, grade, section, 'active');
      const size = 24 + Math.floor(random() * 10);
      while (students.filter((s) => s.grade === grade && s.section === section).length < size) {
        const firstName = pick(random, FIRST_NAMES);
        const lastName = pick(random, LAST_NAMES);
        if (usedNames.has(`${firstName} ${lastName}`) && random() < 0.85) continue;
        const roll = random();
        const status: RecordStatus = roll < 0.03 ? 'archived' : roll < 0.08 ? 'inactive' : 'active';
        add(firstName, lastName, level, grade, section, status);
      }
    }
  }
  return students;
}

/** In-memory table; mutations last for the browser session only. */
export const mockStudentTable: Student[] = generateStudents();

/** Active students of a class ("8-A"), in roster order. */
export function rosterOf(className: string): Student[] {
  const [grade, section] = className.split('-');
  return mockStudentTable.filter((s) => String(s.grade) === grade && s.section === section && s.status !== 'archived');
}

export function fullName(s: { firstName: string; lastName: string }): string {
  return `${s.firstName} ${s.lastName}`;
}
