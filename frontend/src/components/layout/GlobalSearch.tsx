import clsx from 'clsx';
import { CornerDownLeft, Search } from 'lucide-react';
import { type KeyboardEvent, useCallback, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ACCOUNT_PAGES, getNavigation } from '@/config/navigation';
import { ROLE_PREFIX } from '@/config/roles';
import { useDismiss } from '@/hooks/useDismiss';
import type { User } from '@/types';

interface Entry {
  path: string;
  label: string;
  group?: string;
}

function normalise(value: string): string {
  return value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
}

/**
 * Top-bar search: finds pages of the user's own area (works offline, no data sent anywhere).
 * Combobox pattern — arrow keys move, Enter opens, Escape closes.
 */
export function GlobalSearch({ user, className }: { user: User; className?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [];
    for (const group of getNavigation(user.role, user.level)) {
      const groupLabel = t(`nav.${user.role}.${group.id}`);
      if (group.path) list.push({ path: group.path, label: groupLabel });
      for (const item of group.children ?? []) list.push({ path: item.path, label: t(`nav.${user.role}.${item.id}`), group: groupLabel });
    }
    for (const page of ACCOUNT_PAGES) list.push({ path: `${ROLE_PREFIX[user.role]}/${page.slug}`, label: t(`nav.account.${page.id}`) });
    return list;
  }, [t, user.role, user.level]);

  const results = useMemo(() => {
    const q = normalise(query.trim());
    if (!q) return entries.slice(0, 6);
    return entries.filter((e) => normalise(`${e.label} ${e.group ?? ''}`).includes(q)).slice(0, 8);
  }, [entries, query]);

  const go = (entry: Entry) => {
    setOpen(false);
    setQuery('');
    navigate(entry.path);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (event.key === 'Enter' && open && results[activeIndex]) {
      event.preventDefault();
      go(results[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className={clsx('relative', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        aria-label={t('search.label')}
        placeholder={t(`search.placeholder.${user.role}`)}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-12 w-full rounded-[14px] border border-border bg-surface pl-12 pr-4 text-[15px] text-foreground shadow-card transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/15"
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('search.results')}
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-[360px] animate-pop-in overflow-y-auto rounded-[16px] border border-border bg-surface-elevated p-1.5 shadow-pop"
        >
          {results.length === 0 ? (
            <li className="px-3 py-4 text-center text-[14px] text-muted-foreground">{t('search.noResults')}</li>
          ) : (
            results.map((entry, i) => (
              <li
                key={entry.path}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(entry)}
                onMouseEnter={() => setActiveIndex(i)}
                className={clsx(
                  'flex cursor-pointer items-center gap-3 rounded-[11px] px-3 py-2.5',
                  i === activeIndex ? 'bg-accent-soft text-accent-ink' : 'text-foreground',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold">{entry.label}</span>
                  {entry.group && <span className="block truncate text-[12.5px] text-muted-foreground">{entry.group}</span>}
                </span>
                {i === activeIndex && <CornerDownLeft className="h-4 w-4 shrink-0" aria-hidden />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
