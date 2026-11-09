'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { describeAuthError } from '@/lib/auth-error';
import { authService } from '@/services/auth.service';
import { FIELD_CLASS, LABEL_CLASS, SUBMIT_CLASS } from './auth.constants';
import { buildLoginSchema } from './auth.schema';
import { LoginValues, SignedInFormProps } from './auth.types';
import { PasswordInput } from './password-input';

export function PasswordLoginForm({ onSignedIn }: SignedInFormProps) {
  const t = useTranslations('login');
  const te = useTranslations('authErrors');
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginValues>({ resolver: zodResolver(buildLoginSchema(t('invalidEmail'), t('passwordRequired'))) });

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await authService.login(values.email, values.password);
      onSignedIn();
    } catch (failure) {
      setError(te(describeAuthError(failure)));
    }
  });

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div>
        <label htmlFor="login-email" className={LABEL_CLASS}>
          {t('email')}
        </label>
        <input id="login-email" type="email" autoComplete="username" {...register('email')} className={FIELD_CLASS} />
        {formState.errors.email ? <p className="mt-1 text-xs text-danger">{formState.errors.email.message}</p> : null}
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="login-password" className="block text-xs text-muted">
            {t('password')}
          </label>
          <Link href="/forgot-password" className="text-xs text-accent">
            {t('forgotLink')}
          </Link>
        </div>
        <PasswordInput id="login-password" autoComplete="current-password" {...register('password')} />
        {formState.errors.password ? <p className="mt-1 text-xs text-danger">{formState.errors.password.message}</p> : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={formState.isSubmitting} className={SUBMIT_CLASS}>
        {formState.isSubmitting ? t('signingIn') : t('submit')}
      </button>
    </form>
  );
}
