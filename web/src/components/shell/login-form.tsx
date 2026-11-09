'use client';

import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ACCESS_LOGIN_ENABLED, DEV_LOGIN_ENABLED } from '@/config/app.constants';
import { useSessionStore } from '@/stores/session.store';
import { AuthCard } from '@/components/auth/auth-card';
import { AccessLogin } from '@/components/auth/access-login';
import { DevLoginForm } from '@/components/auth/dev-login-form';
import { PasswordLoginForm } from '@/components/auth/password-login-form';

export function LoginForm() {
  const t = useTranslations('login');
  const router = useRouter();
  const queryClient = useQueryClient();
  const authenticated = useSessionStore((s) => s.authenticated);
  const hydrated = useSessionStore((s) => s.hydrated);
  const setAuthenticated = useSessionStore((s) => s.setAuthenticated);

  useEffect(() => {
    if (hydrated && authenticated) router.replace('/');
  }, [authenticated, hydrated, router]);

  const finish = useCallback(() => {
    queryClient.clear();
    setAuthenticated();
    router.replace('/');
  }, [queryClient, router, setAuthenticated]);

  return (
    <AuthCard subtitle={t('subtitle')}>
      {ACCESS_LOGIN_ENABLED ? <AccessLogin onSignedIn={finish} /> : <PasswordLoginForm onSignedIn={finish} />}
      {DEV_LOGIN_ENABLED ? <DevLoginForm onSignedIn={finish} /> : null}
    </AuthCard>
  );
}
