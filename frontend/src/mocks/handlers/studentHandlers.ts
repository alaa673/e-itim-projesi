import type { PaginatedResponse, PaginationParams, Student, StudentInput, StudentListFilters } from '@/types';
import { ApiError } from '@/utils/errorHandling';
import { mockStudentTable } from '../mockStudents';
import { mockDelay } from '../utils';

const collator = new Intl.Collator('tr', { sensitivity: 'base', numeric: true });

function matches(student: Student, filters: StudentListFilters): boolean {
  if (filters.level && student.level !== filters.level) return false;
  if (filters.grade && String(student.grade) !== filters.grade) return false;
  if (filters.status && student.status !== filters.status) return false;
  const term = filters.search.trim().toLocaleLowerCase('tr-TR');
  if (!term) return true;
  const haystack = `${student.firstName} ${student.lastName} ${student.schoolNumber} ${student.email}`.toLocaleLowerCase('tr-TR');
  return haystack.includes(term);
}

function compare(a: Student, b: Student, filters: StudentListFilters): number {
  let result = 0;
  switch (filters.sortKey) {
    case 'schoolNumber':
      result = collator.compare(a.schoolNumber, b.schoolNumber);
      break;
    case 'grade':
      result = a.grade - b.grade || collator.compare(a.section, b.section);
      break;
    case 'enrolledAt':
      result = a.enrolledAt.localeCompare(b.enrolledAt);
      break;
    default:
      result = collator.compare(`${a.firstName} ${a.lastName}`, `${b.firstName} ${b.lastName}`);
  }
  if (result === 0) result = a.id.localeCompare(b.id); // stable order → no duplicated/missing rows across batches
  return filters.sortDirection === 'desc' ? -result : result;
}

export function listStudentsMock(
  filters: StudentListFilters,
  page: PaginationParams,
  signal?: AbortSignal,
): Promise<PaginatedResponse<Student>> {
  return mockDelay(() => {
    const filtered = mockStudentTable.filter((s) => matches(s, filters)).sort((a, b) => compare(a, b, filters));
    return {
      items: filtered.slice(page.offset, page.offset + page.limit).map((s) => ({ ...s })),
      total: filtered.length,
      offset: page.offset,
      limit: page.limit,
    };
  }, signal);
}

function assertUniqueSchoolNumber(schoolNumber: string, ignoreId?: string): void {
  const clash = mockStudentTable.find((s) => s.schoolNumber === schoolNumber && s.id !== ignoreId);
  if (clash) {
    throw new ApiError('conflict', { status: 409, fieldErrors: { schoolNumber: 'duplicateSchoolNumber' } });
  }
}

export function createStudentMock(input: StudentInput): Promise<Student> {
  return mockDelay(() => {
    assertUniqueSchoolNumber(input.schoolNumber);
    const student: Student = {
      ...input,
      id: `stu-new-${Date.now()}`,
      email: input.email.toLocaleLowerCase('tr-TR'),
      enrolledAt: new Date().toISOString(),
    };
    mockStudentTable.unshift(student);
    return { ...student };
  }, undefined, 600);
}

export function updateStudentMock(id: string, input: StudentInput): Promise<Student> {
  return mockDelay(() => {
    const index = mockStudentTable.findIndex((s) => s.id === id);
    if (index === -1) throw new ApiError('not_found', { status: 404 });
    assertUniqueSchoolNumber(input.schoolNumber, id);
    mockStudentTable[index] = { ...mockStudentTable[index], ...input };
    return { ...mockStudentTable[index] };
  }, undefined, 600);
}

export function archiveStudentMock(id: string): Promise<Student> {
  return mockDelay(() => {
    const student = mockStudentTable.find((s) => s.id === id);
    if (!student) throw new ApiError('not_found', { status: 404 });
    student.status = 'archived';
    return { ...student };
  }, undefined, 600);
}

export function countStudentsByLevelMock(): Record<'primary' | 'middle' | 'high', number> {
  const counts = { primary: 0, middle: 0, high: 0 };
  for (const s of mockStudentTable) if (s.status !== 'archived') counts[s.level] += 1;
  return counts;
}

export function countStudentsByGradeMock(): number[] {
  const counts = Array.from({ length: 12 }, () => 0);
  for (const s of mockStudentTable) if (s.status !== 'archived') counts[s.grade - 1] += 1;
  return counts;
}
