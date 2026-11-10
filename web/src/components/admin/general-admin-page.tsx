'use client';

import { TriangleAlert } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useCapabilities } from '@/hooks/use-capabilities';
import { useWorkspaceSummary } from '@/hooks/use-workspace-summary';
import { cn } from '@/lib/cn';
import { ADMIN_PANEL_CLASS } from './admin.constants';
import { AdminPageFrame } from './admin-page-frame';
import { ConfigCard } from './config-card';
import { SUMMARY_COUNTS, SUMMARY_INTEGRATIONS, SUMMARY_ROLES, SUMMARY_STATUSES } from './general-admin.constants';
import { SummaryStat } from './summary-stat';

export function GeneralAdminPage() {
  const t = useTranslations('admin');
  const tp = useTranslations('people');
  const tc = useTranslations('common');
  const format = useFormatter();
  const { canReadAudit } = useCapabilities();
  const summary = useWorkspaceSummary();

  if (!canReadAudit) return <EmptyState title={tc('accessDenied')} hint={t('deniedHint')} />;

  const data = summary.data;
  return (
    <AdminPageFrame title={t('sections.general')} subtitle={t('general.subtitle')}>
      {summary.isLoading ? <Skeleton className="h-40" /> : null}
      {summary.isError ? <EmptyState title={t('loadError')} /> : null}
      {data ? (
        <div className="space-y-4">
          {data.integrations.devLogin ? (
            <p role="status" className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
              {t('general.devLoginOn')}
            </p>
          ) : null}
          <section aria-label={t('general.workspaceTitle')} className={cn(ADMIN_PANEL_CLASS, 'p-3')}>
            <p className="mb-2 text-sm font-medium">{t('general.workspaceTitle')}</p>
            <dl className="grid gap-2 text-sm sm:grid-cols-3">
              <div className="min-w-0">
                <dt className="text-xs text-muted">{t('general.name')}</dt>
                <dd className="break-words">{data.workspace?.name ?? t('general.unknown')}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted">{t('general.slug')}</dt>
                <dd className="break-all font-mono text-xs">{data.workspace?.slug ?? t('general.unknown')}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted">{t('general.createdAt')}</dt>
                <dd>{data.workspace ? format.dateTime(new Date(data.workspace.createdAt), { dateStyle: 'medium' }) : t('general.unknown')}</dd>
              </div>
            </dl>
          </section>
          <section aria-label={t('general.membersTitle')} className={cn(ADMIN_PANEL_CLASS, 'p-3')}>
            <p className="mb-2 text-sm font-medium">{t('general.membersTitle')}</p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {SUMMARY_ROLES.map((role) => (
                <SummaryStat key={role} label={tp(`roles.${role}`)} value={data.members.byRole[role] ?? 0} />
              ))}
            </dl>
            <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {SUMMARY_STATUSES.map((status) => (
                <SummaryStat key={status} label={t(`general.statuses.${status}`)} value={data.members.byStatus[status] ?? 0} />
              ))}
            </dl>
          </section>
          <section aria-label={t('general.contentTitle')} className={cn(ADMIN_PANEL_CLASS, 'p-3')}>
            <p className="mb-2 text-sm font-medium">{t('general.contentTitle')}</p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUMMARY_COUNTS.map((key) => (
                <SummaryStat key={key} label={t(`general.counts.${key}`)} value={data.counts[key]} />
              ))}
            </dl>
          </section>
          <section aria-label={t('general.integrationsTitle')}>
            <p className="mb-2 text-sm font-medium">{t('general.integrationsTitle')}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {SUMMARY_INTEGRATIONS.map((key) => (
                <ConfigCard key={key} label={t(`general.integrations.${key}`)} configured={data.integrations[key]} hint={t(`general.integrationHints.${key}`)} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">{t('general.repositories', { count: data.integrations.githubRepositories })}</p>
          </section>
        </div>
      ) : null}
    </AdminPageFrame>
  );
}
