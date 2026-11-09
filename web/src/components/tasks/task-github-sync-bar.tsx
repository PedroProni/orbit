'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useRefreshGithub } from '@/hooks/use-task-github';
import { cn } from '@/lib/cn';
import { describeRefreshError, notAfter } from './task-github.helpers';
import { GITHUB_REF_TOGGLE_CLASS } from './task-github.constants';
import { TaskGithubSyncBarProps } from './task-github.types';

export function TaskGithubSyncBar({ taskId, readOnly, syncedAt, now }: TaskGithubSyncBarProps) {
  const t = useTranslations('drawer');
  const tApi = useTranslations('apiErrors');
  const format = useFormatter();
  const refresh = useRefreshGithub(taskId);
  const [error, setError] = useState<string | null>(null);
  const run = () => {
    setError(null);
    refresh.mutate(undefined, {
      onError: (err) => {
        const described = describeRefreshError(err);
        setError(tApi(described.key, described.values));
      },
    });
  };
  return (
    <div className="space-y-0.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 px-1.5 text-xs text-muted">
        {syncedAt ? (
          <time dateTime={syncedAt}>
            {t('githubSynced', { time: format.relativeTime(notAfter(syncedAt, now), now) })}
          </time>
        ) : (
          <span>{t('githubNeverSynced')}</span>
        )}
        {readOnly ? null : (
          <button type="button" onClick={run} disabled={refresh.isPending} className={cn(GITHUB_REF_TOGGLE_CLASS, '-ml-1')}>
            <RefreshCw size={12} aria-hidden="true" className={refresh.isPending ? 'animate-spin' : undefined} />
            {refresh.isPending ? t('githubRefreshing') : t('githubRefresh')}
          </button>
        )}
      </div>
      {error ? (
        <p role="alert" className="px-1.5 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
