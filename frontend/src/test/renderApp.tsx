import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { routes } from '@/app/router';
import { ToastProvider } from '@/components/ui/Toast';
import { STORAGE_KEYS } from '@/config/constants';
import i18n from '@/i18n';
import { DEMO_USERS } from '@/mocks/mockUsers';
import type { DemoProfile } from '@/types';

/** Renders the full app (real routes, providers, mock services) at a given path. */
export async function renderApp(path: string, options: { as?: DemoProfile; lang?: 'tr' | 'en' } = {}) {
  await i18n.changeLanguage(options.lang ?? 'tr');
  if (options.as) window.sessionStorage.setItem(STORAGE_KEYS.demoSession, DEMO_USERS[options.as].id);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>,
  );
  return { ...utils, router };
}
