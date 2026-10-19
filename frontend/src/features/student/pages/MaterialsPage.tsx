import clsx from 'clsx';
import { FileText, FolderOpen, NotebookText, Presentation as PresentationIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ListFooter } from '@/components/data/ResourceTable';
import { FilterBar } from '@/components/form/FilterBar';
import { PageHeader } from '@/components/layout/PageHeader';
import { RelativeTime } from '@/components/layout/RelativeTime';
import { SlideDeck } from '@/components/slides/SlideDeck';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { IS_MOCK_MODE } from '@/config/constants';
import { useAsync } from '@/hooks/useAsync';
import { useListQuery } from '@/hooks/useListQuery';
import { useLocale } from '@/hooks/useLocale';
import { useOpenParam } from '@/hooks/useOpenParam';
import { useResourceList } from '@/hooks/useResourceList';
import { formatFileSize } from '@/utils/format';
import { materialApi, subjectApi } from '../services/studentApi';
import type { Material } from '../types';
import { FileLink } from '@/components/ui/FileLink';

const KIND_ICON = { summary: NotebookText, pdf: FileText, presentation: PresentationIcon };
const KIND_TONE = { summary: 'bg-tint-violet text-ink-violet', pdf: 'bg-danger/[0.1] text-danger', presentation: 'bg-tint-peach text-ink-peach' };

/** "1. Başlık" lines → slides. */
function toSlides(body: string, title: string) {
  const lines = body.split('\n').map((l) => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
  return lines.map((line) => {
    const [head, ...rest] = line.split(':');
    return rest.length ? { title: head.trim(), bullets: [rest.join(':').trim()] } : { title: line, bullets: [] as string[] };
  }).concat(lines.length ? [] : [{ title, bullets: [] }]);
}

export default function MaterialsPage() {
  const { t } = useTranslation(['student', 'common']);
  const locale = useLocale();
  const lq = useListQuery<'subject' | 'kind'>({ sort: { key: 'sharedAt', direction: 'desc' }, descFirst: ['sharedAt'] });
  const list = useResourceList(materialApi.list, lq.query);
  const [open, setOpen] = useState<Material | null>(null);
  const subjectList = useAsync((signal) => subjectApi.list(signal), []);
  const subjects = (subjectList.data ?? []).map((x) => x.name);

  const view = async (m: Material) => {
    setOpen(m);
    if (!m.read) {
      const saved = await materialApi.update(m.id, { read: true }).catch(() => null);
      if (saved) list.updateItem(saved);
    }
  };
  useOpenParam((id) => {
    const m = list.items.find((x) => x.id === id);
    if (m) void view(m);
  }, list.items.length > 0);

  return (
    <>
      <PageHeader title={t('nav.student.materials', { ns: 'common' })} description={t('materials.description')} />
      <FilterBar
        search={lq.search}
        onSearch={lq.setSearch}
        searchLabel={t('common.search', { ns: 'common' })}
        searchPlaceholder={t('materials.searchPlaceholder')}
        filters={[
          { key: 'subject', label: t('common.subject', { ns: 'common' }), value: lq.filters.subject ?? '', allLabel: t('common.allSubjects', { ns: 'common' }), options: subjects.map((s) => ({ value: s, label: s })) },
          { key: 'kind', label: t('common.type', { ns: 'common' }), value: lq.filters.kind ?? '', allLabel: t('common.allTypes', { ns: 'common' }), options: (['summary', 'pdf', 'presentation'] as const).map((v) => ({ value: v, label: t(`materials.kinds.${v}`) })) },
        ]}
        onFilter={(k, v) => lq.setFilter(k as 'subject' | 'kind', v)}
        onClear={lq.clear}
      />
      {list.status === 'error' ? (
        <div className="panel">
          <ErrorState error={list.error} onRetry={list.retry} />
        </div>
      ) : list.status === 'loading' && list.items.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-panel" />
          ))}
        </div>
      ) : list.items.length === 0 ? (
        <div className="panel">
          <EmptyState icon={<FolderOpen className="h-5 w-5" aria-hidden />} title={lq.active ? t('states.noResults', { ns: 'common' }) : t('materials.empty')} />
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <ul className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {list.items.map((m) => {
              const Icon = KIND_ICON[m.kind];
              return (
                <li key={m.id}>
                  <button type="button" onClick={() => void view(m)} className="card-interactive flex h-full w-full flex-col rounded-[18px] border border-border bg-surface p-4 text-left">
                    <span className="flex items-start gap-3">
                      <span className={clsx('icon-tile h-11 w-11', KIND_TONE[m.kind])}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-foreground">{m.title}</span>
                        <span className="block text-[12.5px] text-muted-foreground">
                          {m.subject} · {m.topic}
                        </span>
                      </span>
                      {!m.read && <Badge tone="accent">{t('materials.new')}</Badge>}
                    </span>
                    <span className="mt-auto flex items-center justify-between pt-4 text-[12.5px] text-muted-foreground">
                      <span>
                        {m.teacher} · <RelativeTime iso={m.sharedAt} />
                      </span>
                      <span>{t(`materials.kinds.${m.kind}`)}{m.sizeBytes ? ` · ${formatFileSize(m.sizeBytes, locale)}` : ''}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <ListFooter list={list} />
        </div>
      )}

      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        size={open?.kind === 'presentation' ? 'xl' : 'lg'}
        title={open?.title ?? ''}
        description={open ? `${open.subject} · ${open.topic} · ${open.teacher}` : undefined}
        footer={
          open?.kind === 'pdf' && <FileLink name={`${open.title}.pdf`} url={open.fileUrl} />
        }
      >
        {open?.kind === 'presentation' ? (
          <SlideDeck slides={toSlides(open.body, open.title)} title={open.title} />
        ) : open ? (
          <>
            <ol className="space-y-3">
              {open.body.split('\n').filter(Boolean).map((line, i) => (
                <li key={i} className="flex gap-3 rounded-[14px] bg-surface-muted p-3 text-[15px] leading-relaxed text-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">{i + 1}</span>
                  {line}
                </li>
              ))}
            </ol>
            {open.kind === 'pdf' && IS_MOCK_MODE && <p className="mt-4 text-[13px] text-muted-foreground">{t('materials.demoPdf')}</p>}
          </>
        ) : null}
      </Modal>
    </>
  );
}
