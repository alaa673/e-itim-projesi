import { RefreshCw, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import { Button } from '@/components/ui/Button';
import { ROLE_HOME } from '@/config/roles';
import { NotFoundPage } from './NotFoundPage';

/** A lazily loaded page whose file no longer exists — typically after a new version was deployed. */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(message);
}

/**
 * Shown instead of a blank screen when a page throws while rendering or fails to load.
 * Details stay in the console; users only see a short message and a way forward.
 */
export function RouteErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  const navigate = useNavigate();
  const { user } = useAuth();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  const outdated = isChunkLoadError(error);
  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-[20px] bg-warning/15 text-warning">
        <TriangleAlert className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="font-display text-[24px] font-extrabold text-foreground">{t(outdated ? 'appError.updatedTitle' : 'appError.title')}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t(outdated ? 'appError.updatedBody' : 'appError.body')}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="ink" icon={<RefreshCw className="h-4 w-4" aria-hidden />} onClick={() => window.location.reload()}>
          {t('appError.reload')}
        </Button>
        {!outdated && (
          <Button variant="secondary" onClick={() => navigate(user ? ROLE_HOME[user.role] : '/login')}>
            {t('actions.goHome')}
          </Button>
        )}
      </div>
    </div>
  );
}
