import { describe, expect, it } from 'vitest';
import { ACCOUNT_PAGES, flattenNavigation } from '@/config/navigation';
import { ROLES } from '@/config/roles';
import { ACCOUNT_PAGE_COMPONENTS, PAGES } from './router';

describe('router', () => {
  it('has a page component for every menu entry of every role', () => {
    for (const role of ROLES) {
      const missing = flattenNavigation(role)
        .map((e) => e.id)
        .filter((id) => !PAGES[role][id]);
      expect(missing, role).toEqual([]);
    }
  });

  it('has a page component for every account page', () => {
    expect(ACCOUNT_PAGES.map((p) => p.id).filter((id) => !ACCOUNT_PAGE_COMPONENTS[id])).toEqual([]);
  });
});
