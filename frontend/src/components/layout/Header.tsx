import { Menu, Plus } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import { buttonClass } from '@/components/ui/buttonStyles';
import { IS_MOCK_MODE } from '@/config/constants';
import type { User } from '@/types';
import { GlobalSearch } from './GlobalSearch';
import { NotificationMenu } from './NotificationMenu';
import { ThemeToggle } from './ThemeToggle';

/** Mock mode only: the demo role switcher (and the demo accounts it lists) never reaches a real build. */
const DemoSwitcher = IS_MOCK_MODE ? lazy(() => import('./DemoSwitcher').then((m) => ({ default: m.DemoSwitcher }))) : null;

/** Role quick actions shown in the top bar (as in the PUSULA mockups). */
const QUICK_ACTIONS: Record<User['role'], { key: string; to: string; state?: Record<string, unknown> }[]> = {
  admin: [
    { key: 'addUser', to: '/admin/students', state: { openCreate: true } },
    { key: 'createClass', to: '/admin/classes', state: { openCreate: true } },
  ],
  teacher: [{ key: 'createQuiz', to: '/teacher/exams', state: { openCreate: true } }],
  student: [],
};

export function Header({ user, onOpenMenu, menuOpen }: { user: User; onOpenMenu: () => void; menuOpen: boolean }) {
  const { t } = useTranslation();
  const { isDemo } = useAuth();
  return (
    <header className="no-print sticky top-0 z-20 flex h-[84px] shrink-0 items-center gap-3 bg-background/85 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t('actions.openMenu')}
        aria-expanded={menuOpen}
        aria-controls="app-sidebar"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-border bg-surface text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <GlobalSearch user={user} className="min-w-0 flex-1 lg:max-w-[560px]" />
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {QUICK_ACTIONS[user.role].map((action) => (
          <Link key={action.key} to={action.to} state={action.state} className={buttonClass('primary', 'md', 'hidden h-12 rounded-[14px] px-5 md:inline-flex')}>
            <Plus className="h-5 w-5" aria-hidden />
            {t(`quickActions.${action.key}`)}
          </Link>
        ))}
        <ThemeToggle className="hidden h-12 w-12 rounded-[14px] sm:flex" />
        <NotificationMenu role={user.role} />
        {isDemo && DemoSwitcher && (
          <Suspense fallback={null}>
            <DemoSwitcher />
          </Suspense>
        )}
      </div>
    </header>
  );
}
