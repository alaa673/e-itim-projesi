import { z } from 'zod';

/** Messages are i18n keys in the `auth` namespace. Sign-in accepts a username or an e-mail address. */
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'validation.identifierRequired')
    .refine((v) => !v.includes('@') || z.string().email().safeParse(v).success, 'validation.emailInvalid'),
  password: z.string().min(1, 'validation.passwordRequired'),
  remember: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
