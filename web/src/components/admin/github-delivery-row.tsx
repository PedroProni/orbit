'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { ADMIN_BADGE_CLASS } from './admin.constants';
import { GITHUB_OUTCOME_CLASSES, GITHUB_PENDING_OUTCOME_CLASS } from './github-admin.constants';
import { GithubDeliveryRowProps } from './github-admin.types';

export function GithubDeliveryRow({ delivery }: GithubDeliveryRowProps) {
  const t = useTranslations('admin.github');
  const format = useFormatter();
  const outcome = delivery.outcome ?? 'pending';
  return (
    <li className="px-3 py-3">
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:gap-4">
        <time dateTime={delivery.receivedAt} className="shrink-0 text-xs text-muted md:w-36">
          {format.dateTime(new Date(delivery.receivedAt), { dateStyle: 'medium', timeStyle: 'short' })}
        </time>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-mono text-sm">{delivery.event}</span>
            {delivery.action ? <span className="font-mono text-xs text-muted">{delivery.action}</span> : null}
            <span className={cn(ADMIN_BADGE_CLASS, GITHUB_OUTCOME_CLASSES[outcome] ?? GITHUB_PENDING_OUTCOME_CLASS)}>{t(`outcomes.${outcome}`)}</span>
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            <span className="break-all">{delivery.repository ?? t('noRepository')}</span>
            <span>{t('linkedTasks', { count: delivery.linkedTasks })}</span>
            {delivery.duplicates > 0 ? <span>{t('duplicates', { count: delivery.duplicates })}</span> : null}
            {delivery.failureCode ? <span className="text-danger">{t('failure')}</span> : null}
          </div>
        </div>
      </div>
    </li>
  );
}
