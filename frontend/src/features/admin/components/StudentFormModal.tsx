import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { GRADES_BY_LEVEL, IS_MOCK_MODE, SECTIONS } from '@/config/constants';
import type { Student, StudentInput } from '@/types';
import { ApiError, errorMessageKey } from '@/utils/errorHandling';
import { studentService } from '../services/studentService';
import { studentFormSchema, type StudentFormValues } from '../validation';

interface StudentFormModalProps {
  open: boolean;
  student: Student | null; // null → create
  onClose: () => void;
  onSaved: (student: Student, mode: 'create' | 'edit') => void;
}

const EMPTY: StudentFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  schoolNumber: '',
  level: 'high',
  grade: '9',
  section: 'A',
  status: 'active',
};

function toFormValues(student: Student | null): StudentFormValues {
  if (!student) return EMPTY;
  return {
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    schoolNumber: student.schoolNumber,
    level: student.level,
    grade: String(student.grade),
    section: student.section as StudentFormValues['section'],
    status: student.status === 'inactive' ? 'inactive' : 'active',
  };
}

export function StudentFormModal({ open, student, onClose, onSaved }: StudentFormModalProps) {
  const { t } = useTranslation(['admin', 'common']);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const mode = student ? 'edit' : 'create';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<StudentFormValues>({ resolver: zodResolver(studentFormSchema), defaultValues: toFormValues(student) });

  useEffect(() => {
    if (open) {
      reset(toFormValues(student));
      setFormError(null);
      setConfirmDiscard(false);
    }
  }, [open, student, reset]);

  const level = watch('level');
  // Keep the grade consistent with the chosen school level.
  useEffect(() => {
    const allowed = GRADES_BY_LEVEL[level] as readonly number[];
    if (!allowed.includes(Number(getValues('grade')))) setValue('grade', String(allowed[0]), { shouldDirty: true });
  }, [level, getValues, setValue]);

  const requestClose = () => {
    if (isSubmitting) return;
    if (isDirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const input: StudentInput = {
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      schoolNumber: values.schoolNumber.trim(),
      grade: Number(values.grade),
    };
    try {
      const saved = student ? await studentService.update(student.id, input) : await studentService.create(input);
      onSaved(saved, mode);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.schoolNumber) {
        setError('schoolNumber', { message: 'students.form.errors.duplicateSchoolNumber' });
        return;
      }
      setFormError(t(errorMessageKey(error), { ns: 'common' }));
    }
  });

  const err = (key?: string) => (key ? t(key) : undefined);
  const { ref: firstNameRef, ...firstNameField } = register('firstName');

  return (
    <Modal
      open={open}
      onClose={requestClose}
      preventClose={isSubmitting}
      initialFocusRef={firstFieldRef as React.RefObject<HTMLElement>}
      title={mode === 'create' ? t('students.form.createTitle') : t('students.form.editTitle')}
      description={mode === 'create' ? t('students.form.createDescription') : `${student?.firstName} ${student?.lastName} · ${student?.schoolNumber}`}
      footer={
        confirmDiscard ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">{t('students.form.discardQuestion')}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>
                {t('students.form.keepEditing')}
              </Button>
              <Button variant="danger" onClick={onClose}>
                {t('students.form.discard')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button variant="secondary" onClick={requestClose} disabled={isSubmitting}>
              {t('actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" form="student-form" variant="primary" loading={isSubmitting}>
              {mode === 'create' ? t('students.form.submitCreate') : t('actions.save', { ns: 'common' })}
            </Button>
          </>
        )
      }
    >
      <form id="student-form" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('students.form.firstName')}
          autoComplete="off"
          error={err(errors.firstName?.message)}
          ref={(node) => {
            firstNameRef(node);
            firstFieldRef.current = node;
          }}
          {...firstNameField}
        />
        <Input label={t('students.form.lastName')} autoComplete="off" error={err(errors.lastName?.message)} {...register('lastName')} />
        <Input
          label={t('students.form.email')}
          type="email"
          autoComplete="off"
          error={err(errors.email?.message)}
          containerClassName="sm:col-span-2"
          {...register('email')}
        />
        <Input
          label={t('students.form.schoolNumber')}
          inputMode="numeric"
          hint={t('students.form.schoolNumberHint')}
          error={err(errors.schoolNumber?.message)}
          {...register('schoolNumber')}
        />
        <Select
          label={t('students.form.status')}
          options={[
            { value: 'active', label: t('status.active', { ns: 'common' }) },
            { value: 'inactive', label: t('status.inactive', { ns: 'common' }) },
          ]}
          {...register('status')}
        />
        <Select
          label={t('students.form.level')}
          error={err(errors.level?.message)}
          options={(['primary', 'middle', 'high'] as const).map((value) => ({ value, label: t(`levels.${value}`, { ns: 'common' }) }))}
          {...register('level')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t('students.form.grade')}
            error={err(errors.grade?.message)}
            options={GRADES_BY_LEVEL[level].map((g) => ({ value: String(g), label: t('gradeLabel', { ns: 'common', grade: g }) }))}
            {...register('grade')}
          />
          <Select
            label={t('students.form.section')}
            error={err(errors.section?.message)}
            options={SECTIONS.map((s) => ({ value: s, label: s }))}
            {...register('section')}
          />
        </div>
        {formError && (
          <p role="alert" className="rounded-control bg-danger/10 px-3 py-2 text-sm font-medium text-danger sm:col-span-2">
            {formError}
          </p>
        )}
        {IS_MOCK_MODE && <p className="text-[12.5px] text-muted-foreground sm:col-span-2">{t('demo.notPersisted', { ns: 'common' })}</p>}
      </form>
    </Modal>
  );
}
