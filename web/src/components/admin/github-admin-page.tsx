'use client';

import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { notAfter } from '@/components/tasks/task-github.helpers';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useGithubDeliveries, useGithubIntegration } from '@/hooks/use-github-integration';
import { cn } from '@/lib/cn';
import { ADMIN_BADGE_CLASS, ADMIN_LABEL_CLASS, ADMIN_PANEL_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from './admin.constants';
import { AdminPageFrame } from './admin-page-frame';
import { ConfigCard } from './config-card';
import { GITHUB_ALL, GITHUB_DELIVERY_EVENTS, GITHUB_DELIVERY_OUTCOMES, MS_PER_MINUTE } from './github-admin.constants';
import { GithubDeliveryRow } from './github-delivery-row';

export function GithubAdminPage() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const format = useFormatter();
  const { canReadAudit } = useCapabilities();
  const status = useGithubIntegration();
  const [event, setEvent] = useState(GITHUB_ALL);
  const [outcome, setOutcome] = useState(GITHUB_ALL);
  const deliveries = useGithubDeliveries({ event: event || undefined, outcome: outcome || undefined });
  const items = useMemo(() => deliveries.data?.pages.flatMap((page) => page.items) ?? [], [deliveries.data]);
  const now = new Date();

  if (!canReadAudit) return <EmptyState title={tc('accessDenied')} hint={t('deniedHint')} />;

  return (
    <AdminPageFrame title={t('sections.github')} subtitle={t('github.subtitle')}>
      {status.isLoading ? <Skeleton className="h-24" /> : null}
      {status.isError ? <EmptyState title={t('loadError')} /> : null}
      {status.data ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <ConfigCard label={t('github.secret')} configured={status.data.secretConfigured} hint={status.data.secretConfigured ? t('github.secretHint') : t('github.secretMissing')} />
            <ConfigCard label={t('github.token')} configured={status.data.tokenConfigured} hint={status.data.tokenConfigured ? t('github.tokenHint') : t('github.tokenMissing')} />
          </div>
          <section aria-label={t('github.webhookTitle')} className={cn(ADMIN_PANEL_CLASS, 'p-3')}>
            <p className="text-sm font-medium">{t('github.webhookTitle')}</p>
            <p className="mt-1 text-xs text-muted">{t('github.webhookHint')}</p>
            <code className="mt-2 inline-block break-all rounded bg-panel2 px-2 py-1 text-xs">{status.data.webhookPath}</code>
          </section>
          <section aria-label={t('github.repositoriesTitle')} className={ADMIN_PANEL_CLASS}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-3 pt-3">
              <p className="text-sm font-medium">{t('github.repositoriesTitle')}</p>
              {status.data.syncIntervalMs > 0 ? (
                <p className="text-xs text-muted">{t('github.syncEvery', { minutes: Math.max(1, Math.round(status.data.syncIntervalMs / MS_PER_MINUTE)) })}</p>
              ) : (
                <p className="text-xs text-muted">{t('github.syncOff')}</p>
              )}
            </div>
            {status.data.repositories.length === 0 ? <p className="px-3 py-3 text-xs text-muted">{t('github.noRepositories')}</p> : null}
            <ul className="divide-y divide-line">
              {status.data.repositories.map((repo) => (
                <li key={repo.fullName} className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1 break-all font-mono text-sm">{repo.fullName}</span>
                  {repo.syncing ? (
                    <span className={cn(ADMIN_BADGE_CLASS, 'flex items-center gap-1 bg-accentsoft text-fg')}>
                      <RefreshCw size={11} className="animate-spin" aria-hidden="true" />
                      {t('github.syncing')}
                    </span>
                  ) : null}
                  <span className="text-xs text-muted">{repo.lastSuccessAt ? t('github.lastSync', { when: format.relativeTime(notAfter(repo.lastSuccessAt, now), now) }) : t('github.neverSynced')}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
      <h2 className="mb-2 mt-6 text-sm font-semibold">{t('github.deliveriesTitle')}</h2>
      <p className="mb-3 text-xs text-muted">{t('github.deliveriesHint')}</p>
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div>
          <span className={ADMIN_LABEL_CLASS}>{t('github.eventFilter')}</span>
          <Select ariaLabel={t('github.eventFilter')} value={event} options={[{ value: GITHUB_ALL, label: t('github.anyEvent') }, ...GITHUB_DELIVERY_EVENTS.map((value) => ({ value, label: value }))]} onChange={setEvent} />
        </div>
        <div>
          <span className={ADMIN_LABEL_CLASS}>{t('github.outcomeFilter')}</span>
          <Select
            ariaLabel={t('github.outcomeFilter')}
            value={outcome}
            options={[{ value: GITHUB_ALL, label: t('github.anyOutcome') }, ...GITHUB_DELIVERY_OUTCOMES.map((value) => ({ value, label: t(`github.outcomes.${value}`) }))]}
            onChange={setOutcome}
          />
        </div>
      </div>
      <section aria-label={t('github.deliveriesTitle')} className={ADMIN_PANEL_CLASS}>
        {deliveries.isLoading ? <Skeleton className="m-3 h-16" /> : null}
        {deliveries.isError ? <EmptyState title={t('loadError')} /> : null}
        {deliveries.isSuccess && items.length === 0 ? <EmptyState title={t('github.noDeliveries')} hint={t('github.noDeliveriesHint')} /> : null}
        <ul className="divide-y divide-line">
          {items.map((delivery) => (
            <GithubDeliveryRow key={delivery.id} delivery={delivery} />
          ))}
        </ul>
      </section>
      {deliveries.hasNextPage ? (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={() => deliveries.fetchNextPage()} disabled={deliveries.isFetchingNextPage} className={ADMIN_SECONDARY_BUTTON_CLASS}>
            {deliveries.isFetchingNextPage ? t('loadingMore') : t('loadMore')}
          </button>
        </div>
      ) : null}
    </AdminPageFrame>
  );
}
