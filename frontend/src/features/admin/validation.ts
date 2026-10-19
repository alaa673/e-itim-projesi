import { z } from 'zod';
import { GRADES_BY_LEVEL, SECTIONS } from '@/config/constants';

/** Error messages are i18n keys in the `admin` namespace (students.form.errors.*). */
const e = (key: string) => `students.form.errors.${key}`;

export const studentFormSchema = z
  .object({
    firstName: z.string().trim().min(2, e('firstName')).max(50, e('tooLong')),
    lastName: z.string().trim().min(2, e('lastName')).max(50, e('tooLong')),
    email: z.string().trim().min(1, e('emailRequired')).email(e('emailInvalid')),
    schoolNumber: z.string().trim().regex(/^\d{3,10}$/, e('schoolNumber')),
    level: z.enum(['primary', 'middle', 'high'], { errorMap: () => ({ message: e('level') }) }),
    grade: z.string().min(1, e('grade')),
    section: z.enum(SECTIONS, { errorMap: () => ({ message: e('section') }) }),
    status: z.enum(['active', 'inactive']),
  })
  .refine((v) => (GRADES_BY_LEVEL[v.level] as readonly number[]).includes(Number(v.grade)), {
    path: ['grade'],
    message: e('gradeMismatch'),
  });

export type StudentFormValues = z.infer<typeof studentFormSchema>;
