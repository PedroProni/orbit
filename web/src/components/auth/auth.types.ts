import { InputHTMLAttributes, ReactNode } from 'react';
import { z } from 'zod';
import { buildChangePasswordSchema, buildForgotSchema, buildInviteSchema, buildLoginSchema, buildNewPasswordSchema } from './auth.schema';

export type LoginValues = z.infer<ReturnType<typeof buildLoginSchema>>;
export type ForgotValues = z.infer<ReturnType<typeof buildForgotSchema>>;
export type NewPasswordValues = z.infer<ReturnType<typeof buildNewPasswordSchema>>;
export type ChangePasswordValues = z.infer<ReturnType<typeof buildChangePasswordSchema>>;
export type InviteValues = z.infer<ReturnType<typeof buildInviteSchema>>;

export interface AuthCardProps {
  subtitle?: string;
  children: ReactNode;
}

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
}

export type SetPasswordState = 'checking' | 'invalid' | 'ready' | 'done';

export interface SignedInFormProps {
  onSignedIn: () => void;
}
