'use client';

import { useState } from 'react';
import { useNow, useTranslations } from 'next-intl';
import { useLinkPullRequest, useUnlinkPullRequest } from '@/hooks/use-task-links';
import { useTaskGithub } from '@/hooks/use-task-github';
import { describeApiError } from '@/lib/api-error';
import { INLINE_INPUT_CLASS } from './task-plan-fields.constants';
import { SLOT_ADD_CLASS } from './task-link-slots.constants';
import { GITHUB_NOW_UPDATE_MS } from './task-github.constants';
import { TaskGithubPullRequestItem } from './task-github-pull-request-item';
import { TaskGithubRefs } from './task-github-refs';
import { TaskGithubSyncBar } from './task-github-sync-bar';
import { TaskSlotProps } from './task-link-slots.types';

export function TaskPullRequestSlot({ taskId, readOnly }: TaskSlotProps) {
  const t = useTranslations('drawer');
  const tApi = useTranslations('apiErrors');
  const github = useTaskGithub(taskId);
  const now = useNow({ updateInterval: GITHUB_NOW_UPDATE_MS });
  const link = useLinkPullRequest(taskId);
  const unlink = useUnlinkPullRequest(taskId);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const items = github.data?.pullRequests ?? [];
  const close = () => {
    setDraft(null);
    setError(null);
  };
  const submit = () => {
    const url = (draft ?? '').trim();
    if (!url) {
      close();
      return;
    }
    link.mutate(url, {
      onSuccess: close,
      onError: (err) => {
        const described = describeApiError(err);
        setError(tApi(described.key, described.values));
      },
    });
  };
  return (
    <div className="space-y-1">
      {items.length ? (
        <ul aria-label={t('pullRequests')} className="space-y-1">
          {items.map((item) => (
            <TaskGithubPullRequestItem key={item.id} item={item} readOnly={readOnly} now={now} unlinking={unlink.isPending} onUnlink={(linkId) => unlink.mutate(linkId)} />
          ))}
        </ul>
      ) : null}
      <TaskGithubRefs kind="branch" refs={github.data?.branches ?? []} />
      <TaskGithubRefs kind="commit" refs={github.data?.commits ?? []} />
      {draft !== null ? (
        <div className="space-y-0.5">
          <input
            type="url"
            autoFocus
            aria-label={t('linkPullRequest')}
            aria-invalid={!!error}
            placeholder={t('pullRequestPlaceholder')}
            value={draft}
            disabled={link.isPending}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                close();
              }
            }}
            onBlur={() => !(draft ?? '').trim() && close()}
            className={INLINE_INPUT_CLASS}
          />
          {error ? (
            <p role="alert" className="px-1.5 text-xs text-danger">
              {error}
            </p>
          ) : null}
        </div>
      ) : readOnly ? (
        items.length ? null : (
          <span className="px-1.5 text-muted">{t('emptyValue')}</span>
        )
      ) : (
        <button type="button" onClick={() => setDraft('')} className={SLOT_ADD_CLASS}>
          {items.length ? t('linkPullRequest') : t('addGithubLink')}
        </button>
      )}
      {github.data?.syncEnabled ? <TaskGithubSyncBar taskId={taskId} readOnly={readOnly} syncedAt={github.data.syncedAt} now={now} /> : null}
    </div>
  );
}
