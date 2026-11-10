'use client';

import Link from 'next/link';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { notAfter } from '@/components/tasks/task-github.helpers';
import { Skeleton } from '@/components/ui/skeleton';
import { useAutomationRuns } from '@/hooks/use-automations';
import { describeRunReason } from './automation.helpers';
import { AutomationHistoryProps } from './automation.types';
import { AutomationRunBadge } from './automation-run-badge';

export function AutomationHistory({ automationId }: AutomationHistoryProps) {
  const t = useTranslations('admin.automations');
  const format = useFormatter();
  const locale = useLocale();
  const runs = useAutomationRuns(automationId, true);
  const now = new Date();
  if (runs.isLoading) return <Skeleton className="h-10" />;
  if (runs.isError) return <p className="text-xs text-danger">{t('historyError')}</p>;
  if (!runs.data?.length) return <p className="text-xs text-muted">{t('historyEmpty')}</p>;
  return (
    <ul aria-label={t('history')} className="space-y-1.5">
      {runs.data.map((run) => {
        const reason = describeRunReason(run.reason);
        return (
          <li key={run.id} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <AutomationRunBadge status={run.status} label={t(`runStatus.${run.status}`)} />
            <Link href={`/t/${encodeURIComponent(run.taskId)}`} className="min-w-0 max-w-full truncate text-fg hover:underline">
              {run.taskTitle ?? t('removedTask')}
            </Link>
            {reason ? <span className="min-w-0 text-muted">{t(`reasons.${reason.key}`, reason.values)}</span> : null}
            <time dateTime={run.createdAt} title={new Date(run.createdAt).toLocaleString(locale)} className="ml-auto shrink-0 text-muted">
              {format.relativeTime(notAfter(run.createdAt, now), now)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
