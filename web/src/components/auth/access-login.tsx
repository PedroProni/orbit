'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { orbitService } from '@/services/orbit.service';
import { AccessLoginState } from '@/components/shell/login-form.types';
import { SignedInFormProps } from './auth.types';

export function AccessLogin({ onSignedIn }: SignedInFormProps) {
  const t = useTranslations('login');
  const [state, setState] = useState<AccessLoginState>('pending');
  const started = useRef(false);

  const attempt = useCallback(async () => {
    setState('pending');
    try {
      await orbitService.loginAccess();
      onSignedIn();
    } catch {
      setState('failed');
    }
  }, [onSignedIn]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void attempt();
  }, [attempt]);

  if (state === 'pending') {
    return (
      <p role="status" className="mb-4 text-sm">
        {t('accessSigningIn')}
      </p>
    );
  }
  return (
    <>
      <button type="button" onClick={() => void attempt()} className="mb-4 w-full rounded bg-accent px-3 py-2 text-sm font-medium text-white">
        {t('accessRetry')}
      </button>
      <p role="alert" className="text-sm text-danger">
        {t('denied')}
      </p>
    </>
  );
}
