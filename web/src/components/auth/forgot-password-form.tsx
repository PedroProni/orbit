'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { describeAuthError } from '@/lib/auth-error';
import { authService } from '@/services/auth.service';
import { ForgotPasswordResponse } from '@/services/auth.types';
import { FIELD_CLASS, LABEL_CLASS, SUBMIT_CLASS } from './auth.constants';
import { AuthCard } from './auth-card';
import { buildForgotSchema } from './auth.schema';
import { ForgotValues } from './auth.types';

export function ForgotPasswordForm() {
  const t = useTranslations('forgotPassword');
  const tl = useTranslations('login');
  const te = useTranslations('authErrors');
  const [delivery, setDelivery] = useState<ForgotPasswordResponse['delivery'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ForgotValues>({ resolver: zodResolver(buildForgotSchema(tl('invalidEmail'))) });

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      setDelivery((await authService.forgotPassword(values.email)).delivery);
    } catch (failure) {
      setError(te(describeAuthError(failure)));
    }
  });

  return (
    <AuthCard subtitle={delivery ? undefined : t('subtitle')}>
      {delivery ? (
        <p role="status" className="text-sm">
          {delivery === 'admin' ? t('askAdmin') : t('emailSent')}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          <div>
            <label htmlFor="forgot-email" className={LABEL_CLASS}>
              {tl('email')}
            </label>
            <input id="forgot-email" type="email" autoComplete="username" {...register('email')} className={FIELD_CLASS} />
            {formState.errors.email ? <p className="mt-1 text-xs text-danger">{formState.errors.email.message}</p> : null}
          </div>
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={formState.isSubmitting} className={SUBMIT_CLASS}>
            {t('submit')}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-xs">
        <Link href="/login" className="text-accent">
          {t('backToLogin')}
        </Link>
      </p>
    </AuthCard>
  );
}
