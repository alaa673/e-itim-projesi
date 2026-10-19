import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import { useCrumbs } from '@/components/layout/useCrumbs';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoadingSpinner } from '@/components/ui/Spinner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/** Shared shell for all three roles; the role sets the accent colour via data-role on <body>. */
export function DashboardLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const crumbs = useCrumbs(user?.role ?? 'student');
  useDocumentTitle(user ? crumbs[crumbs.length - 1]?.label : null);

  // A new page starts at the top (the scrolling container is <main>, not the window).
  useEffect(() => {
    mainRef.current?.scrollTo?.({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    document.body.dataset.role = user.role;
    return () => {
      delete document.body.dataset.role;
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="app-shell flex h-full">
      <a href="#main" className="sr-only z-50 rounded bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        {t('skipToContent')}
      </a>
      <Sidebar user={user} mobileOpen={menuOpen} onClose={closeMenu} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header user={user} onOpenMenu={openMenu} menuOpen={menuOpen} />
        <main ref={mainRef} id="main" tabIndex={-1} className="scrollbar-thin flex-1 overflow-y-auto focus:outline-none">
          <div className="mx-auto w-full max-w-[1480px] px-4 pb-12 pt-2 sm:px-6 lg:px-8">
            <Suspense fallback={<LoadingSpinner label={t('states.loading')} />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
