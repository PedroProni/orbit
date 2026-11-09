'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { orbitService } from '@/services/orbit.service';
import { buildDevLoginSchema } from '@/components/shell/login-form.schema';
import { DevLoginValues } from '@/components/shell/login-form.types';
import { FIELD_CLASS, LABEL_CLASS } from './auth.constants';
import { SignedInFormProps } from './auth.types';

export function DevLoginForm({ onSignedIn }: SignedInFormProps) {
  const t = useTranslations('login');
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<DevLoginValues>({ resolver: zodResolver(buildDevLoginSchema(t('invalidEmail'), t('nameRequired'))) });

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await orbitService.devLogin(values.email, values.name);
      onSignedIn();
    } catch {
      setError(t('denied'));
    }
  });

  return (
    <form onSubmit={submit} className="mt-5 space-y-3 border-t border-line pt-4" noValidate>
      <p className="text-xs text-muted">{t('devTitle')}</p>
      <div>
        <label htmlFor="email" className={LABEL_CLASS}>
          {t('email')}
        </label>
        <input id="email" type="email" {...register('email')} className={FIELD_CLASS} />
        {formState.errors.email ? <p className="mt-1 text-xs text-danger">{formState.errors.email.message}</p> : null}
      </div>
      <div>
        <label htmlFor="name" className={LABEL_CLASS}>
          {t('name')}
        </label>
        <input id="name" {...register('name')} className={FIELD_CLASS} />
        {formState.errors.name ? <p className="mt-1 text-xs text-danger">{formState.errors.name.message}</p> : null}
      </div>
      <button type="submit" className="w-full rounded border border-line px-3 py-2 text-sm font-medium">
        {t('devSubmit')}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
