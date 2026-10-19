import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, type DefaultValues, type FieldValues, type Path, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { ZodType } from 'zod';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { ApiError, errorMessageKey } from '@/utils/errorHandling';

export type FieldType = 'text' | 'email' | 'number' | 'date' | 'datetime-local' | 'time' | 'url' | 'select' | 'textarea' | 'switch' | 'checkboxes';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type?: FieldType;
  options?: FieldOption[];
  placeholder?: string;
  /** First empty option for selects (e.g. "Seçin"). */
  placeholderOption?: string;
  hint?: string;
  /** 2 = full width in the two-column grid. */
  span?: 1 | 2;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
  disabled?: boolean;
  description?: string;
}

interface FormModalProps<V extends FieldValues> {
  open: boolean;
  title: string;
  description?: string;
  fields: FieldConfig[];
  schema: ZodType<V>;
  defaultValues: DefaultValues<V>;
  submitLabel: string;
  onSubmit: (values: V) => Promise<void>;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
  /** Extra content under the fields (e.g. a note about demo data). */
  footnote?: string;
}

/**
 * Declarative create/edit dialog: fields from config, validation from a zod schema whose messages are
 * i18n keys, server field errors mapped back onto the fields, and no double submission.
 */
export function FormModal<V extends FieldValues>({
  open,
  title,
  description,
  fields,
  schema,
  defaultValues,
  submitLabel,
  onSubmit,
  onClose,
  size = 'md',
  footnote,
}: FormModalProps<V>) {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<V>({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setFormError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors && Object.keys(error.fieldErrors).length) {
        for (const [field, code] of Object.entries(error.fieldErrors)) {
          setError(field as Path<V>, { message: `validation.${code}` });
        }
        return;
      }
      setFormError(t(errorMessageKey(error)));
    }
  });

  const message = (name: string): string | undefined => {
    const err = errors[name as keyof typeof errors] as { message?: string } | undefined;
    return err?.message ? t(err.message) : undefined;
  };

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      preventClose={isSubmitting}
      size={size}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" form="form-modal" loading={isSubmitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="form-modal" onSubmit={submit} noValidate className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        {formError && (
          <p role="alert" className="flex items-center gap-2 rounded-[12px] border border-danger/25 bg-danger/[0.07] px-3.5 py-2.5 text-sm font-medium text-danger sm:col-span-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {formError}
          </p>
        )}
        {fields.map((field) => {
          const span = clsx(field.span === 2 || field.type === 'textarea' || field.type === 'checkboxes' || field.type === 'switch' ? 'sm:col-span-2' : undefined);
          const name = field.name as Path<V>;
          switch (field.type) {
            case 'select':
              return (
                <Select
                  key={field.name}
                  containerClassName={span}
                  label={field.label}
                  options={field.options ?? []}
                  placeholderOption={field.placeholderOption}
                  disabled={field.disabled}
                  error={message(field.name)}
                  {...register(name)}
                />
              );
            case 'textarea':
              return (
                <Textarea
                  key={field.name}
                  containerClassName={span}
                  label={field.label}
                  rows={field.rows ?? 4}
                  placeholder={field.placeholder}
                  hint={field.hint}
                  disabled={field.disabled}
                  error={message(field.name)}
                  {...register(name)}
                />
              );
            case 'switch':
              return (
                <Controller
                  key={field.name}
                  control={control}
                  name={name}
                  render={({ field: f }) => (
                    <Switch className={span} label={field.label} description={field.description} checked={Boolean(f.value)} onChange={f.onChange} disabled={field.disabled} />
                  )}
                />
              );
            case 'checkboxes':
              return (
                <Controller
                  key={field.name}
                  control={control}
                  name={name}
                  render={({ field: f }) => {
                    const value: string[] = Array.isArray(f.value) ? f.value : [];
                    return (
                      <fieldset className={span}>
                        <legend className="field-label">{field.label}</legend>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {(field.options ?? []).map((option) => (
                            <Checkbox
                              key={option.value}
                              label={option.label}
                              checked={value.includes(option.value)}
                              onChange={(e) => f.onChange(e.target.checked ? [...value, option.value] : value.filter((v) => v !== option.value))}
                            />
                          ))}
                        </div>
                        {message(field.name) && (
                          <p role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
                            {message(field.name)}
                          </p>
                        )}
                      </fieldset>
                    );
                  }}
                />
              );
            default:
              return (
                <Input
                  key={field.name}
                  containerClassName={span}
                  label={field.label}
                  type={field.type ?? 'text'}
                  placeholder={field.placeholder}
                  hint={field.hint}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  autoComplete={field.autoComplete ?? 'off'}
                  disabled={field.disabled}
                  error={message(field.name)}
                  {...register(name)}
                />
              );
          }
        })}
        {footnote && <p className="text-[13px] text-muted-foreground sm:col-span-2">{footnote}</p>}
      </form>
    </Modal>
  );
}
