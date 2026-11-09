'use client';

import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { describeAuthError } from '@/lib/auth-error';
import { authService } from '@/services/auth.service';
import { AccessLinkInfo } from '@/services/auth.types';
import { ACCESS_LINK_HASH_PREFIX, LABEL_CLASS, PASSWORD_MIN_LENGTH, SUBMIT_CLASS } from './auth.constants';
import { AuthCard } from './auth-card';
import { buildNewPasswordSchema } from './auth.schema';
import { NewPasswordValues, SetPasswordState } from './auth.types';
import { PasswordInput } from './password-input';

export function SetPasswordForm() {
  const t = useTranslations('setPassword');
  const te = useTranslations('authErrors');
  const [state, setState] = useState<SetPasswordState>('checking');
  const [info, setInfo] = useState<AccessLinkInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = useRef('');
  const started = useRef(false);
  const { register, handleSubmit, formState } = useForm<NewPasswordValues>({ resolver: zodResolver(buildNewPasswordSchema(te('passwordTooShort', { min: PASSWORD_MIN_LENGTH }), te('passwordTooLong'), t('mismatch'))) });

  useEffect(() => {
    const open = () => {
      const { hash, pathname } = window.location;
      token.current = hash.startsWith(ACCESS_LINK_HASH_PREFIX) ? hash.slice(ACCESS_LINK_HASH_PREFIX.length) : '';
      window.history.replaceState(null, '', pathname);
      setError(null);
      if (!token.current) {
        setState('invalid');
        return;
      }
      setState('checking');
      authService.checkLink(token.current).then(
        (link) => {
          setInfo(link);
          setState('ready');
        },
        () => setState('invalid'),
      );
    };
    window.addEventListener('hashchange', open);
    if (!started.current) {
      started.current = true;
      open();
    }
    return () => window.removeEventListener('hashchange', open);
  }, []);

  const save = async (values: NewPasswordValues) => {
    setError(null);
    try {
      await authService.setPassword(token.current, values.password);
      token.current = '';
      setState('done');
    } catch (failure) {
      const key = describeAuthError(failure);
      if (key === 'invalidLink') setState('invalid');
      else setError(te(key, { min: PASSWORD_MIN_LENGTH }));
    }
  };

  if (state === 'checking') {
    return (
      <AuthCard>
        <p role="status" className="text-sm text-muted">
          {t('checking')}
        </p>
      </AuthCard>
    );
  }
  if (state === 'invalid') {
    return (
      <AuthCard>
        <p role="alert" className="text-sm text-danger">
          {te('invalidLink')}
        </p>
        <p className="mt-4 text-center text-xs">
          <Link href="/login" className="text-accent">
            {t('goToLogin')}
          </Link>
        </p>
      </AuthCard>
    );
  }
  if (state === 'done') {
    return (
      <AuthCard>
        <p role="status" className="text-sm">
          {t('done')}
        </p>
        <Link href="/login" className={`${SUBMIT_CLASS} mt-4 block text-center`}>
          {t('goToLogin')}
        </Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard subtitle={info?.kind === 'reset' ? t('resetTitle') : t('inviteTitle')}>
      <p className="mb-3 truncate text-sm font-medium" title={info?.email}>
        {info?.email}
      </p>
      <form onSubmit={(event) => void handleSubmit(save)(event)} className="space-y-3" noValidate>
        <input type="email" autoComplete="username" value={info?.email ?? ''} readOnly hidden />
        <div>
          <label htmlFor="new-password" className={LABEL_CLASS}>
            {t('password')}
          </label>
          <PasswordInput id="new-password" autoComplete="new-password" aria-describedby="new-password-hint" {...register('password')} />
          <p id="new-password-hint" className="mt-1 text-xs text-muted">
            {t('hint', { min: PASSWORD_MIN_LENGTH })}
          </p>
          {formState.errors.password ? <p className="mt-1 text-xs text-danger">{formState.errors.password.message}</p> : null}
        </div>
        <div>
          <label htmlFor="confirm-password" className={LABEL_CLASS}>
            {t('confirm')}
          </label>
          <PasswordInput id="confirm-password" autoComplete="new-password" {...register('confirm')} />
          {formState.errors.confirm ? <p className="mt-1 text-xs text-danger">{formState.errors.confirm.message}</p> : null}
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
    </AuthCard>
  );
}
