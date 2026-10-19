import type { ReactNode } from 'react';
import { useAuth } from '@/app/providers/authContext';
import { Sparkle } from '@/components/brand/Sparkle';
import { Breadcrumbs } from './Breadcrumbs';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Small context line under the description (chips, term, counts). */
  meta?: ReactNode;
  /** Hide the breadcrumb trail (e.g. on dashboards). */
  hideBreadcrumbs?: boolean;
}

/** Inner-page heading: breadcrumb trail, heavy display title, description and page actions. */
export function PageHeader({ title, description, actions, meta, hideBreadcrumbs }: PageHeaderProps) {
  const { user } = useAuth();
  return (
    <div className="mb-6 pt-2 motion-safe:animate-rise-in sm:mb-8">
      {!hideBreadcrumbs && user && <Breadcrumbs role={user.role} />}
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="relative inline-flex items-start gap-2 font-display text-[30px] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-[38px]">
            {title}
            <Sparkle className="mt-1 h-5 w-5 text-brand-amber" />
          </h1>
          {description && <p className="mt-2 max-w-[70ch] text-[15.5px] text-muted-foreground">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}
