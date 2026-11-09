import { z } from 'zod';
import { NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './auth.constants';

export const buildLoginSchema = (invalidEmail: string, passwordRequired: string) => z.object({ email: z.string().email(invalidEmail), password: z.string().min(1, passwordRequired).max(PASSWORD_MAX_LENGTH, passwordRequired) });

export const buildForgotSchema = (invalidEmail: string) => z.object({ email: z.string().email(invalidEmail) });

export const buildNewPasswordSchema = (tooShort: string, tooLong: string, mismatch: string) =>
  z
    .object({ password: z.string().min(PASSWORD_MIN_LENGTH, tooShort).max(PASSWORD_MAX_LENGTH, tooLong), confirm: z.string() })
    .refine((values) => values.password === values.confirm, { message: mismatch, path: ['confirm'] });

export const buildChangePasswordSchema = (required: string, tooShort: string, tooLong: string, mismatch: string) =>
  z
    .object({ currentPassword: z.string().min(1, required), password: z.string().min(PASSWORD_MIN_LENGTH, tooShort).max(PASSWORD_MAX_LENGTH, tooLong), confirm: z.string() })
    .refine((values) => values.password === values.confirm, { message: mismatch, path: ['confirm'] });

export const buildInviteSchema = (invalidEmail: string, nameRequired: string) => z.object({ email: z.string().email(invalidEmail), name: z.string().trim().min(1, nameRequired).max(NAME_MAX_LENGTH, nameRequired), allowExternalEmail: z.boolean() });
