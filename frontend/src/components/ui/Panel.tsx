import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PanelProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Icon shown before the title (PUSULA cards). */
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: 'section' | 'div' | 'article';
  id?: string;
}

/** Card used to group related content. */
export function Panel({ title, description, icon: Icon, action, children, className, bodyClassName, as: Tag = 'section', id }: PanelProps) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <Tag
      className={clsx('panel scroll-mt-24 focus:outline-none', className)}
      aria-labelledby={title ? headingId : undefined}
      id={id}
      tabIndex={id ? -1 : undefined}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && <Icon className="mt-0.5 h-[22px] w-[22px] shrink-0 text-foreground" aria-hidden />}
            <div className="min-w-0">
              {title && (
                <h2 id={headingId} className="font-display text-[19px] font-extrabold leading-tight text-foreground">
                  {title}
                </h2>
              )}
              {description && <p className="mt-1 text-[14px] text-muted-foreground">{description}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={clsx('px-5 pb-5 sm:px-6', title || action ? 'pt-4' : 'pt-5', bodyClassName)}>{children}</div>
    </Tag>
  );
}
