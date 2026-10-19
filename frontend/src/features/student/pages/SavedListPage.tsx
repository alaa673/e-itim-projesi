import { ArrowDown, ArrowUp, Bookmark, Compass, NotebookPen, Printer, School, Trash2, GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/authContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { AsyncContent, EmptyState } from '@/components/ui/States';
import { Textarea } from '@/components/ui/Textarea';
import { useAction } from '@/hooks/useAction';
import { useAsync } from '@/hooks/useAsync';
import { useLocale } from '@/hooks/useLocale';
import { formatDate, formatNumber } from '@/utils/format';
import { savedApi } from '../services/studentApi';
import type { SavedChoice } from '../types';

export default function SavedListPage() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const { user } = useAuth();
  const high = user?.level === 'high';
  const { data, error, loading, reload } = useAsync((signal) => savedApi.list({ offset: 0, limit: 100, sortKey: 'order', sortDirection: 'asc' }, signal), []);
  const [items, setItems] = useState<SavedChoice[]>([]);
  const [noteFor, setNoteFor] = useState<SavedChoice | null>(null);
  const [note, setNote] = useState('');
  const [deleting, setDeleting] = useState<SavedChoice | null>(null);
  const { run, busy } = useAction();
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    if (data) setItems(data.items);
  }, [data]);

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    const previous = items;
    setItems(next.map((s, i) => ({ ...s, order: i + 1 })));
    setAnnounce(t('saved.moved', { name: next[target].name, position: target + 1 }));
    const ok = await run(async () => {
      await savedApi.reorder(next.map((s) => s.id));
      return true;
    });
    if (!ok) setItems(previous);
  };

  return (
    <>
      <div className="no-print">
        <PageHeader
          title={t('nav.student.savedList', { ns: 'common' })}
          description={t(high ? 'saved.descriptionYks' : 'saved.descriptionLgs')}
          actions={
            <>
              <Link to="/student/guidance/preferences" className={buttonClass('secondary')}>
                <Compass className="h-4 w-4" aria-hidden />
                {t('nav.student.preferenceAssistant', { ns: 'common' })}
              </Link>
              <Button variant="ink" icon={<Printer className="h-4 w-4" aria-hidden />} disabled={items.length === 0} onClick={() => window.print()}>
                {t('saved.print')}
              </Button>
            </>
          }
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <AsyncContent data={data} error={error} loading={loading} reload={reload}>
        {() =>
          items.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={<Bookmark className="h-5 w-5" aria-hidden />}
                title={t('saved.empty')}
                description={t('saved.emptyHint')}
                action={
                  <Link to="/student/guidance/preferences" className={buttonClass('primary')}>
                    {t('nav.student.preferenceAssistant', { ns: 'common' })}
                  </Link>
                }
              />
            </div>
          ) : (
            <section aria-labelledby="saved-title" className="panel print-area overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4 sm:px-6">
                <div>
                  <h2 id="saved-title" className="font-display text-[19px] font-extrabold text-foreground">
                    {t('saved.title')}
                  </h2>
                  <p className="text-[13px] text-muted-foreground">
                    <span className="hidden print:inline">
                      {user?.firstName} {user?.lastName} · {formatDate(new Date().toISOString(), locale)} ·{' '}
                    </span>
                    {t('saved.count', { count: items.length })}
                  </p>
                </div>
                <p className="max-w-md text-[12.5px] text-muted-foreground">{t('saved.notOfficial')}</p>
              </header>
              <ol>
                {items.map((s, i) => (
                  <li key={s.id} className="flex items-start gap-3 border-b border-border px-5 py-4 last:border-0 sm:px-6">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display text-[15px] font-extrabold text-primary-foreground print:border print:border-black print:bg-transparent print:text-black">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{s.name}</span>
                        <Badge tone="neutral" icon={s.kind === 'school' ? <School className="h-3 w-3" aria-hidden /> : <GraduationCap className="h-3 w-3" aria-hidden />}>
                          {t(`saved.kind.${s.kind}`)}
                        </Badge>
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        {s.detail}
                        {s.score !== null && ` · ${t('preferences.baseScore')}: ${formatNumber(s.score, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        {s.rank !== null && ` · ${t('preferences.baseRank')}: ${formatNumber(s.rank, locale)}`}
                      </p>
                      {s.note && (
                        <p className="mt-1.5 rounded-[10px] bg-lime-soft px-3 py-1.5 text-[13.5px] text-foreground">
                          <span className="sr-only">{t('saved.note')}: </span>
                          {s.note}
                        </p>
                      )}
                    </div>
                    <span className="no-print flex shrink-0 items-center">
                      <IconButton icon={ArrowUp} label={`${t('actions.moveUp', { ns: 'common' })}: ${s.name}`} disabled={i === 0 || busy} onClick={() => void move(i, -1)} />
                      <IconButton icon={ArrowDown} label={`${t('actions.moveDown', { ns: 'common' })}: ${s.name}`} disabled={i === items.length - 1 || busy} onClick={() => void move(i, 1)} />
                      <IconButton
                        icon={NotebookPen}
                        label={`${t('saved.editNote')}: ${s.name}`}
                        onClick={() => {
                          setNote(s.note);
                          setNoteFor(s);
                        }}
                      />
                      <IconButton icon={Trash2} tone="danger" label={`${t('actions.remove', { ns: 'common' })}: ${s.name}`} onClick={() => setDeleting(s)} />
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )
        }
      </AsyncContent>

      <Modal
        open={noteFor !== null}
        onClose={() => setNoteFor(null)}
        size="sm"
        title={t('saved.editNote')}
        description={noteFor?.name}
        footer={
          <>
            <Button variant="secondary" onClick={() => setNoteFor(null)}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                if (!noteFor) return;
                const updated = await run(() => savedApi.update(noteFor.id, { note: note.trim() }), { success: t('saved.noteSaved') });
                if (updated) {
                  setItems((prev) => prev.map((x) => (x.id === updated.id ? { ...x, note: updated.note } : x)));
                  setNoteFor(null);
                }
              }}
            >
              {t('actions.save', { ns: 'common' })}
            </Button>
          </>
        }
      >
        <Textarea label={t('saved.note')} rows={3} maxLength={160} value={note} onChange={(e) => setNote(e.target.value)} hint={t('saved.noteHint', { count: 160 - note.length })} />
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={t('saved.removeTitle')}
        message={t('saved.removeMessage', { name: deleting?.name ?? '' })}
        confirmLabel={t('actions.remove', { ns: 'common' })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const removedId = deleting.id;
          const ok = await run(
            async () => {
              await savedApi.remove(removedId);
              const rest = items.filter((x) => x.id !== removedId);
              if (rest.length) await savedApi.reorder(rest.map((x) => x.id));
              return true;
            },
            { success: t('saved.removed') },
          );
          if (ok) {
            setDeleting(null);
            reload();
          }
        }}
      />
    </>
  );
}
