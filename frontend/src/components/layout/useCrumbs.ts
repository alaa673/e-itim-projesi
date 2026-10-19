import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { ACCOUNT_PAGES, flattenNavigation } from '@/config/navigation';
import { ROLE_HOME, ROLE_PREFIX } from '@/config/roles';
import type { UserRole } from '@/types';

/** "Home / Group / Page" for a path, from the central navigation config (also used for the tab title). */
export function useCrumbs(role: UserRole) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const entry = flattenNavigation(role).find((e) => e.path === pathname);
  const account = ACCOUNT_PAGES.find((p) => `${ROLE_PREFIX[role]}/${p.slug}` === pathname);

  const crumbs: { label: string; to?: string }[] = [{ label: t(`nav.${role}.home`), to: ROLE_HOME[role] }];
  if (entry && entry.path !== ROLE_HOME[role]) {
    if (entry.groupId) crumbs.push({ label: t(`nav.${role}.${entry.groupId}`) });
    crumbs.push({ label: t(`nav.${role}.${entry.id}`) });
  } else if (account) {
    crumbs.push({ label: t(`nav.account.${account.id}`) });
  }
  return crumbs;
}
