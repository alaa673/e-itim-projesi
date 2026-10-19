import clsx from 'clsx';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { PusulaLogo } from '@/components/brand/PusulaLogo';
import { SidebarLandscape } from '@/components/brand/SidebarLandscape';
import { getNavigation } from '@/config/navigation';
import type { User } from '@/types';
import { AccountCard } from './AccountCard';

interface SidebarProps {
  user: User;
  mobileOpen: boolean;
  onClose: () => void;
}

/*
 * Deep role-coloured sidebar (".sidebar-island" remaps the neutral tokens inside it).
 * The current page is a lime pill, as in the PUSULA mockups; groups expand to a bulleted list.
 */
const topItem = 'group relative flex w-full items-center gap-3.5 rounded-[14px] px-4 text-left transition-colors';
const idle = 'text-sidebar-foreground/90 hover:bg-white/[0.07] hover:text-white';
const active = 'bg-lime font-bold text-lime-foreground shadow-[0_10px_24px_-14px_rgb(var(--lime)/0.9)]';

export function Sidebar({ user, mobileOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const groups = useMemo(() => getNavigation(user.role, user.level), [user.role, user.level]);

  const activeGroupId = groups.find((g) => g.children?.some((c) => pathname === c.path || pathname.startsWith(`${c.path}/`)))?.id;
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(activeGroupId ? [activeGroupId] : []));

  // Keep the group containing the current page expanded.
  useEffect(() => {
    if (activeGroupId) setOpenGroups((prev) => (prev.has(activeGroupId) ? prev : new Set(prev).add(activeGroupId)));
  }, [activeGroupId]);

  // Close the mobile drawer after navigating.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggle = (id: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={clsx('no-print fixed inset-0 z-30 bg-overlay/50 backdrop-blur-[2px] transition-opacity lg:hidden', mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0')}
      />
      <aside
        id="app-sidebar"
        className={clsx(
          'no-print sidebar-island fixed inset-y-0 left-0 z-40 flex w-[288px] max-w-[86vw] flex-col overflow-hidden bg-[linear-gradient(180deg,rgb(var(--sidebar))_0%,rgb(var(--sidebar-2))_100%)] transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full',
        )}
        aria-label={t('sidebar.mainNav')}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="relative flex items-start justify-between gap-3 px-7 pb-6 pt-7">
          <PusulaLogo area={t(`area.${user.role}`)} />
          <button
            type="button"
            onClick={onClose}
            className="-mr-3 rounded-md p-1.5 text-sidebar-muted hover:bg-white/[0.08] hover:text-white lg:hidden"
            aria-label={t('sidebar.close')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav className="scrollbar-thin relative z-10 min-h-0 flex-1 overflow-y-auto px-4 pb-4" aria-label={t('sidebar.mainNav')}>
          <ul className="space-y-1.5">
            {groups.map((group) => {
              const Icon = group.icon;
              const label = t(`nav.${user.role}.${group.id}`);
              if (group.path) {
                return (
                  <li key={group.id}>
                    <NavLink to={group.path} end className={({ isActive }) => clsx(topItem, 'h-14 text-[16px] font-semibold', isActive ? active : idle)}>
                      {({ isActive }) => (
                        <>
                          <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden />
                          <span className="flex-1 truncate">{label}</span>
                          {isActive && <ChevronRight className="h-5 w-5" aria-hidden />}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              }
              const open = openGroups.has(group.id);
              const containsActive = group.id === activeGroupId;
              const panelId = `nav-group-${group.id}`;
              return (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => toggle(group.id)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className={clsx(topItem, 'h-12 text-[15.5px] font-semibold', containsActive ? 'text-white' : idle)}
                  >
                    <Icon className={clsx('h-[22px] w-[22px] shrink-0', containsActive && 'text-lime')} aria-hidden />
                    <span className="flex-1 truncate">{label}</span>
                    <ChevronDown className={clsx('h-[18px] w-[18px] opacity-80 transition-transform', open && 'rotate-180')} aria-hidden />
                  </button>
                  <ul id={panelId} hidden={!open} className="mb-2 ml-[27px] mt-1 space-y-0.5 border-l border-white/15 pl-3">
                    {group.children?.map((item) => (
                      <li key={item.id}>
                        <NavLink
                          to={item.path}
                          className={({ isActive }) =>
                            clsx(
                              'relative flex items-center gap-3 rounded-[11px] px-3 py-2 text-[14.5px] transition-colors',
                              isActive ? 'bg-lime font-bold text-lime-foreground' : 'text-sidebar-foreground/85 hover:bg-white/[0.07] hover:text-white',
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span aria-hidden className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', isActive ? 'bg-lime-foreground' : 'bg-sidebar-foreground/70')} />
                              <span className="truncate">{t(`nav.${user.role}.${item.id}`)}</span>
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="relative shrink-0">
          <SidebarLandscape
            variant={user.role === 'admin' ? 'school' : 'star'}
            className="pointer-events-none -mb-[72px] h-[210px] [@media(max-height:820px)]:hidden"
          />
          <div className="relative z-10 px-4 pb-4">
            <AccountCard user={user} />
          </div>
        </div>
      </aside>
    </>
  );
}
