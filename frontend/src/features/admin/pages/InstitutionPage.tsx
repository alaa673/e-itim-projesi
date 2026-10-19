import { Building2, ImageUp, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { FileDrop } from '@/components/ui/FileDrop';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { AsyncContent } from '@/components/ui/States';
import { CITIES } from '@/config/catalog';
import { SaveBar } from '../components/SaveBar';
import { useSettings } from '../hooks/useSettings';
import type { InstitutionSettings } from '../services/adminApi';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InstitutionPage() {
  const { t } = useTranslation(['admin', 'common']);
  const s = useSettings('institution');

  return (
    <>
      <PageHeader title={t('institution.title')} description={t('institution.description')} />
      <AsyncContent data={s.draft} error={s.error} loading={s.loading} reload={s.reload}>
        {(d) => {
          const set = (patch: Partial<InstitutionSettings>) => s.setDraft({ ...d, ...patch });
          const req = (v: string) => (v.trim() ? undefined : t('validation.required', { ns: 'common' }));
          const errors = {
            name: req(d.name),
            shortName: req(d.shortName),
            email: req(d.email) ?? (EMAIL_RE.test(d.email) ? undefined : t('validation.email', { ns: 'common' })),
            website: d.website && !/^https:\/\//.test(d.website) ? t('institution.httpsOnly') : undefined,
          };
          const valid = !Object.values(errors).some(Boolean);
          return (
            <>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <Panel icon={Building2} title={t('institution.identity')}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input containerClassName="sm:col-span-2" label={t('institution.name')} value={d.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} />
                    <Input label={t('institution.shortName')} value={d.shortName} maxLength={6} onChange={(e) => set({ shortName: e.target.value.toUpperCase() })} error={errors.shortName} hint={t('institution.shortHint')} />
                    <Select
                      label={t('institution.type')}
                      value={d.type}
                      onChange={(e) => set({ type: e.target.value })}
                      options={['İlkokul', 'Ortaokul', 'Lise', 'Ortaokul ve Lise', 'İlkokul, Ortaokul ve Lise'].map((v) => ({ value: v, label: v }))}
                    />
                    <Select label={t('common.city', { ns: 'common' })} value={d.city} onChange={(e) => set({ city: e.target.value })} options={CITIES.map((v) => ({ value: v, label: v }))} />
                    <Input label={t('common.phone', { ns: 'common' })} type="tel" value={d.phone} onChange={(e) => set({ phone: e.target.value })} />
                    <Input containerClassName="sm:col-span-2" label={t('institution.address')} value={d.address} onChange={(e) => set({ address: e.target.value })} />
                    <Input label={t('common.email', { ns: 'common' })} type="email" value={d.email} onChange={(e) => set({ email: e.target.value })} error={errors.email} />
                    <Input label={t('institution.website')} type="url" value={d.website} onChange={(e) => set({ website: e.target.value })} error={errors.website} placeholder="https://" />
                  </div>
                </Panel>

                <div className="space-y-6">
                  <Panel icon={ImageUp} title={t('institution.logo')} description={t('institution.logoHint')}>
                    <div className="flex items-center gap-4">
                      <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-border bg-surface-muted">
                        {d.logoDataUrl ? <img src={d.logoDataUrl} alt={t('institution.logoAlt')} className="h-full w-full object-contain" /> : <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden />}
                      </span>
                      {d.logoDataUrl && (
                        <Button variant="ghost" size="sm" icon={<Trash2 className="h-4 w-4" aria-hidden />} onClick={() => set({ logoDataUrl: null })}>
                          {t('actions.remove', { ns: 'common' })}
                        </Button>
                      )}
                    </div>
                    <FileDrop
                      className="mt-4"
                      label={t('institution.logoFile')}
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      maxSize={1024 * 1024}
                      hint={t('institution.logoFileHint')}
                      files={[]}
                      onChange={(files) => {
                        const file = files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => set({ logoDataUrl: String(reader.result) });
                        reader.readAsDataURL(file);
                      }}
                    />
                  </Panel>
                  <Panel title={t('institution.academic')}>
                    <div className="space-y-4">
                      <SegmentedControl
                        label={t('institution.defaultLanguage')}
                        value={d.defaultLanguage}
                        onChange={(v) => set({ defaultLanguage: v })}
                        options={[
                          { value: 'tr', label: 'Türkçe' },
                          { value: 'en', label: 'English' },
                        ]}
                      />
                      <Select
                        label={t('institution.lessonMinutes')}
                        value={String(d.lessonMinutes)}
                        onChange={(e) => set({ lessonMinutes: Number(e.target.value) })}
                        options={[30, 35, 40, 45, 50].map((v) => ({ value: String(v), label: t('common.minutes', { ns: 'common', count: v }) }))}
                      />
                      <SegmentedControl
                        label={t('institution.gradingScale')}
                        value={d.gradingScale}
                        onChange={(v) => set({ gradingScale: v })}
                        options={[
                          { value: '100', label: t('institution.scale100') },
                          { value: '5', label: t('institution.scale5') },
                        ]}
                      />
                    </div>
                  </Panel>
                </div>
              </div>
              <SaveBar dirty={s.dirty} saving={s.saving} onReset={s.reset} onSave={() => valid && void s.save()} />
              {!valid && s.dirty && <p className="mt-2 text-right text-[13px] text-danger">{t('settings.fixErrors')}</p>}
            </>
          );
        }}
      </AsyncContent>
    </>
  );
}
