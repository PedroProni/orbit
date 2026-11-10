'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccountSessions, useRevokeOtherSessions, useRevokeSession } from '@/hooks/use-account';
import { useSessionStore } from '@/stores/session.store';
import { describeDevice } from './device.helpers';

export function SessionsList() {
  const t = useTranslations('account');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const clear = useSessionStore((s) => s.clear);
  const sessions = useAccountSessions();
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const rows = sessions.data ?? [];

  const end = async (id: string) => {
    const result = await revoke.mutateAsync(id).catch(() => null);
    if (!result?.current) return;
    clear();
    queryClient.clear();
    router.replace('/login');
  };

  return (
    <section className="rounded-xl border border-line bg-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{t('sessionsTitle')}</h2>
          <p className="mt-1 text-xs text-muted">{t('sessionsHint')}</p>
        </div>
        {rows.length > 1 ? (
          <button type="button" disabled={revokeOthers.isPending} onClick={() => revokeOthers.mutate()} className="rounded border border-line px-3 py-1.5 text-xs hover:bg-panel2 disabled:opacity-60">
            {t('endOthers')}
          </button>
        ) : null}
      </div>
      {sessions.isLoading ? <Skeleton className="h-16 w-full" /> : null}
      {sessions.isError ? <ErrorState title={t('sessionsError')} onRetry={sessions.refetch} /> : null}
      <ul className="divide-y divide-line">
        {rows.map((session) => (
          <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0">
              <p className="break-words text-sm" title={session.userAgent ?? undefined}>
                {describeDevice(session.userAgent) ?? t('unknownDevice')}
                {session.current ? <span className="ml-2 rounded bg-panel2 px-1.5 py-0.5 text-xs text-accent">{t('thisDevice')}</span> : null}
              </p>
              <p className="mt-0.5 text-xs text-muted">{t('sessionMeta', { ip: session.ip ?? t('unknownAddress'), date: new Date(session.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) })}</p>
            </div>
            <button
              type="button"
              aria-label={t('endSessionLabel', { device: describeDevice(session.userAgent) ?? t('unknownDevice') })}
              disabled={revoke.isPending}
              onClick={() => void end(session.id)}
              className="rounded border border-line px-2 py-1 text-xs hover:bg-panel2 disabled:opacity-60"
            >
              {session.current ? t('endCurrent') : t('endSession')}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
