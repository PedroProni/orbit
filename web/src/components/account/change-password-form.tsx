'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { LABEL_CLASS, PASSWORD_MIN_LENGTH } from '@/components/auth/auth.constants';
import { buildChangePasswordSchema } from '@/components/auth/auth.schema';
import { ChangePasswordValues } from '@/components/auth/auth.types';
import { PasswordInput } from '@/components/auth/password-input';
import { useChangePassword } from '@/hooks/use-account';
import { describeAuthError } from '@/lib/auth-error';

export function ChangePasswordForm() {
  const t = useTranslations('account');
  const tl = useTranslations('login');
  const te = useTranslations('authErrors');
  const tp = useTranslations('setPassword');
  const change = useChangePassword();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<ChangePasswordValues>({ resolver: zodResolver(buildChangePasswordSchema(tl('passwordRequired'), te('passwordTooShort', { min: PASSWORD_MIN_LENGTH }), te('passwordTooLong'), tp('mismatch'))) });

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await change.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.password });
      reset();
    } catch (failure) {
      setError(te(describeAuthError(failure), { min: PASSWORD_MIN_LENGTH }));
    }
  });

  return (
    <section className="rounded-xl border border-line bg-panel p-5">
      <h2 className="text-sm font-semibold">{t('passwordTitle')}</h2>
      <p className="mb-4 mt-1 text-xs text-muted">{t('passwordHint')}</p>
      <form onSubmit={submit} className="max-w-sm space-y-3" noValidate>
        <input type="email" autoComplete="username" hidden readOnly />
        <div>
          <label htmlFor="current-password" className={LABEL_CLASS}>
            {t('currentPassword')}
          </label>
          <PasswordInput id="current-password" autoComplete="current-password" {...register('currentPassword')} />
          {formState.errors.currentPassword ? <p className="mt-1 text-xs text-danger">{formState.errors.currentPassword.message}</p> : null}
        </div>
        <div>
          <label htmlFor="next-password" className={LABEL_CLASS}>
            {t('newPassword')}
          </label>
          <PasswordInput id="next-password" autoComplete="new-password" {...register('password')} />
          <p className="mt-1 text-xs text-muted">{tp('hint', { min: PASSWORD_MIN_LENGTH })}</p>
          {formState.errors.password ? <p className="mt-1 text-xs text-danger">{formState.errors.password.message}</p> : null}
        </div>
        <div>
          <label htmlFor="next-password-confirm" className={LABEL_CLASS}>
            {tp('confirm')}
          </label>
          <PasswordInput id="next-password-confirm" autoComplete="new-password" {...register('confirm')} />
          {formState.errors.confirm ? <p className="mt-1 text-xs text-danger">{formState.errors.confirm.message}</p> : null}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={formState.isSubmitting} className="rounded bg-accent px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
          {t('changePassword')}
        </button>
      </form>
    </section>
  );
}
