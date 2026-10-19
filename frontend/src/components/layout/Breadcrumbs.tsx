import { ChevronRight, House } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { UserRole } from '@/types';
import { useCrumbs } from './useCrumbs';

/** Derives "Home / Group / Page" from the central navigation config. */
export function Breadcrumbs({ role }: { role: UserRole }) {
  const { t } = useTranslation();
  const crumbs = useCrumbs(role);

  return (
    <nav aria-label={t('breadcrumbs')} className="min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-[13.5px] text-muted-foreground">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="inline-flex min-w-0 items-center gap-1.5">
              {crumb.to && !last ? (
                <Link to={crumb.to} className="inline-flex items-center gap-1.5 rounded-[6px] font-medium transition-colors hover:text-accent-ink">
                  {i === 0 && <House className="h-3.5 w-3.5" aria-hidden />}
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={last ? 'truncate font-semibold text-foreground' : undefined}>
                  {crumb.label}
                </span>
              )}
              {!last && <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
