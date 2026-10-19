import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/toastContext';
import { IS_MOCK_MODE } from '@/config/constants';
import { ApiError, errorMessageKey } from '@/utils/errorHandling';
import { changePassword } from '../services/accountApi';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'validation.required'),
    newPassword: z.string().min(8, 'validation.passwordWeak').regex(/[A-Za-zÇĞİÖŞÜçğıöşü]/, 'validation.passwordWeak').regex(/\d/, 'validation.passwordWeak'),
    confirm: z.string().min(1, 'validation.required'),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'validation.passwordMismatch' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'validation.sameAsCurrent' });
type PasswordValues = z.infer<typeof passwordSchema>;

/** 0–4: length ≥ 8, ≥ 12, mixed case, digit + symbol. Shown as guidance only — the server enforces the policy. */
function strength(value: string): number {
  if (!value) return 0;
  let s = 0;
  if (value.length >= 8) s += 1;
  if (value.length >= 12) s += 1;
  if (/[a-zçğıöşü]/.test(value) && /[A-ZÇĞİÖŞÜ]/.test(value)) s += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(value)) s += 1;
  return s;
}
const STRENGTH_COLOR = ['bg-border', 'bg-danger', 'bg-chart-4', 'bg-success', 'bg-success'];

/**
 * Change-password form (current + new + confirm, strength guide). The server verifies the current
 * password and enforces the policy; used on the settings page and on the forced first-login screen.
 */
export function PasswordForm({ onDone, fullWidthSubmit = false }: { onDone?: () => void; fullWidthSubmit?: boolean }) {
  const { t } = useTranslation(['account', 'common']);
  const { notify } = useToast();
  const [show, setShow] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '', confirm: '' } });
  const level = strength(watch('newPassword'));
  const msg = (key?: string) => (key ? t(key, { ns: 'common' }) : undefined);

  const toggle = (
    <button
      type="button"
      onClick={() => setShow((v) => !v)}
      aria-label={show ? t('settings.hidePasswords') : t('settings.showPasswords')}
      aria-pressed={show}
      className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
    >
      {show ? <EyeOff className="h-[18px] w-[18px]" aria-hidden /> : <Eye className="h-[18px] w-[18px]" aria-hidden />}
    </button>
  );

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        setFormError(null);
        try {
          await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
          reset();
          notify({ tone: 'success', title: IS_MOCK_MODE ? t('settings.passwordCheckedDemo') : t('settings.passwordChanged'), description: IS_MOCK_MODE ? t('settings.passwordDemoNote') : undefined });
          onDone?.();
        } catch (error) {
          if (error instanceof ApiError && error.fieldErrors.currentPassword) {
            setError('currentPassword', { message: `validation.${error.fieldErrors.currentPassword}` });
            return;
          }
          setFormError(t(errorMessageKey(error), { ns: 'common' }));
        }
      })}
    >
      <Input label={t('settings.currentPassword')} type={show ? 'text' : 'password'} autoComplete="current-password" trailing={toggle} error={msg(errors.currentPassword?.message)} {...register('currentPassword')} />
      <div>
        <Input label={t('settings.newPassword')} type={show ? 'text' : 'password'} autoComplete="new-password" error={msg(errors.newPassword?.message)} hint={t('settings.policy')} {...register('newPassword')} />
        <div className="mt-2 flex items-center gap-3" aria-live="polite">
          <span className="flex flex-1 gap-1" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={clsx('h-1.5 flex-1 rounded-full transition-colors', i <= level ? STRENGTH_COLOR[level] : 'bg-border')} />
            ))}
          </span>
          <span className="w-24 text-right text-[12.5px] font-semibold text-muted-foreground">{t(`settings.strength.${level}`)}</span>
        </div>
      </div>
      <Input label={t('settings.confirmPassword')} type={show ? 'text' : 'password'} autoComplete="new-password" error={msg(errors.confirm?.message)} {...register('confirm')} />
      {formError && (
        <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-[14px] text-danger">
          {formError}
        </p>
      )}
      <ul className="space-y-1 rounded-[14px] bg-surface-muted px-4 py-3 text-[13px] text-muted-foreground">
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
          {t('settings.tip1')}
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
          {t('settings.tip2')}
        </li>
      </ul>
      <div className="flex justify-end">
        <Button type="submit" variant="ink" className={fullWidthSubmit ? 'w-full' : undefined} loading={isSubmitting} icon={<KeyRound className="h-4 w-4" aria-hidden />}>
          {t('settings.changePassword')}
        </Button>
      </div>
    </form>
  );
}
