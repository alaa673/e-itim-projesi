import { describe, expect, it } from 'vitest';
import { flattenNavigation, getNavigation } from './navigation';

describe('role navigation', () => {
  it('gives each role its own home page', () => {
    expect(flattenNavigation('admin')[0].path).toBe('/admin/dashboard');
    expect(flattenNavigation('teacher')[0].path).toBe('/teacher/dashboard');
    expect(flattenNavigation('student')[0].path).toBe('/student/dashboard');
  });

  it('keeps every route inside the role prefix and unique', () => {
    for (const role of ['admin', 'teacher', 'student'] as const) {
      const paths = flattenNavigation(role).map((e) => e.path);
      expect(paths.every((p) => p.startsWith(`/${role}/`))).toBe(true);
      expect(new Set(paths).size).toBe(paths.length);
    }
  });

  it('hides exam preparation and guidance from primary-school students', () => {
    const ids = getNavigation('student', 'primary').map((g) => g.id);
    expect(ids).not.toContain('examPrep');
    expect(ids).not.toContain('guidance');
  });

  it('shows university tools only to high-school students', () => {
    const middle = getNavigation('student', 'middle').find((g) => g.id === 'guidance');
    const high = getNavigation('student', 'high').find((g) => g.id === 'guidance');
    expect(middle?.children?.map((c) => c.id)).not.toContain('majors');
    expect(high?.children?.map((c) => c.id)).toContain('majors');
  });
});
