import { z } from 'zod';

/** Shared zod pieces; messages are i18n keys in the common namespace (validation.*). */
export const required = () => z.string().trim().min(1, 'validation.required');
export const optionalText = () => z.string().trim().optional().or(z.literal(''));
export const email = () => z.string().trim().min(1, 'validation.required').email('validation.email');
export const intInRange = (min: number, max: number) =>
  z.coerce.number({ invalid_type_error: 'validation.number' }).int('validation.integer').min(min, 'validation.min').max(max, 'validation.max');
export const dateString = () => z.string().min(1, 'validation.required').refine((v) => !Number.isNaN(new Date(v).getTime()), 'validation.date');
export const atLeastOne = () => z.array(z.string()).min(1, 'validation.pickOne');
