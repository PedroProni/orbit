'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AuthCard } from '@/components/auth/auth-card';
import { FIELD_CLASS, LABEL_CLASS, SUBMIT_CLASS } from '@/components/auth/auth.constants';
import { Skeleton } from '@/components/ui/skeleton';
import { useApiErrorText } from '@/hooks/use-api-error-text';
import { ApiError } from '@/lib/api-client';
import { formService } from '@/services/form.service';
import { PUBLIC_FORM_ANSWER_MAX_LENGTH, PUBLIC_FORM_HONEYPOT_CLASS, PUBLIC_FORM_HONEYPOT_NAME, PUBLIC_FORM_NOT_FOUND_STATUS, PUBLIC_FORM_QUERY_KEY, PUBLIC_FORM_TOO_MANY_STATUS } from './public-form.constants';
import { PublicFormState } from './public-form.types';

export function PublicFormPage() {
  const t = useTranslations('publicForm');
  const errorText = useApiErrorText();
  const { key } = useParams<{ key: string }>();
  const definition = useQuery({ queryKey: [PUBLIC_FORM_QUERY_KEY, key], queryFn: () => formService.publicDefinition(key), retry: false });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<PublicFormState>('editing');
  const [error, setError] = useState<string | null>(null);

  if (definition.isLoading) {
    return (
      <AuthCard>
        <Skeleton className="h-40" />
      </AuthCard>
    );
  }

  if (definition.isError || !definition.data || state === 'gone') {
    return (
      <AuthCard>
        <p role="status" className="text-sm font-medium">
          {t('notFound')}
        </p>
        <p className="mt-1 text-sm text-muted">{t('notFoundHint')}</p>
      </AuthCard>
    );
  }

  const form = definition.data;

  if (state === 'sent') {
    return (
      <AuthCard subtitle={form.name}>
        <p role="status" className="text-sm">
          {t('sent')}
        </p>
        <button type="button" onClick={() => setState('editing')} className={`${SUBMIT_CLASS} mt-4`}>
          {t('sendAnother')}
        </button>
      </AuthCard>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const missing = form.fields.find((field) => field.required && !answers[field.id]?.trim());
    if (missing) {
      setError(t('required', { label: missing.label }));
      return;
    }
    setState('sending');
    setError(null);
    try {
      const filled = Object.fromEntries(Object.entries(answers).filter(([, value]) => value.trim()));
      await formService.submit(key, { answers: filled, website });
      setAnswers({});
      setState('sent');
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === PUBLIC_FORM_NOT_FOUND_STATUS) {
        setState('gone');
        return;
      }
      setError(failure instanceof ApiError && failure.status === PUBLIC_FORM_TOO_MANY_STATUS ? t('tooMany') : errorText(failure));
      setState('editing');
    }
  };

  return (
    <AuthCard subtitle={form.name}>
      <form onSubmit={(event) => void submit(event)} className="relative space-y-3" noValidate>
        {form.fields.map((field) => (
          <div key={field.id}>
            <label htmlFor={`public-field-${field.id}`} className={LABEL_CLASS}>
              {field.required ? t('requiredLabel', { label: field.label }) : field.label}
            </label>
            <textarea
              id={`public-field-${field.id}`}
              rows={2}
              required={field.required}
              aria-required={field.required}
              maxLength={PUBLIC_FORM_ANSWER_MAX_LENGTH}
              value={answers[field.id] ?? ''}
              onChange={(event) => {
                setAnswers((current) => ({ ...current, [field.id]: event.target.value }));
                setError(null);
              }}
              className={FIELD_CLASS}
            />
          </div>
        ))}
        <div aria-hidden="true" className={PUBLIC_FORM_HONEYPOT_CLASS}>
          <label htmlFor="public-form-website">{t('honeypotLabel')}</label>
          <input id="public-form-website" name={PUBLIC_FORM_HONEYPOT_NAME} type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={state === 'sending'} className={SUBMIT_CLASS}>
          {state === 'sending' ? t('sending') : t('send')}
        </button>
      </form>
    </AuthCard>
  );
}
