'use client';

import { useState } from 'react';
import { GitPullRequest, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLinkPullRequest, usePullRequests, useUnlinkPullRequest } from '@/hooks/use-task-links';
import { describeApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { INLINE_INPUT_CLASS } from './task-plan-fields.constants';
import { PULL_REQUEST_LINK_CLASS, PULL_REQUEST_STATE_CLASS, PULL_REQUEST_TITLE_CLASS, SLOT_ADD_CLASS } from './task-link-slots.constants';
import { TaskSlotProps } from './task-link-slots.types';

export function TaskPullRequestSlot({ taskId, readOnly }: TaskSlotProps) {
  const t = useTranslations('drawer');
  const tApi = useTranslations('apiErrors');
  const pullRequests = usePullRequests(taskId);
  const link = useLinkPullRequest(taskId);
  const unlink = useUnlinkPullRequest(taskId);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const items = pullRequests.data ?? [];
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
        <ul aria-label={t('pullRequests')} className="space-y-0.5">
          {items.map((item) => (
            <li key={item.id} className="group flex min-w-0 items-center gap-1.5 px-1.5">
              <GitPullRequest size={13} aria-hidden="true" className={cn('shrink-0', item.state ? PULL_REQUEST_STATE_CLASS[item.state] : 'text-muted')} />
              <a href={item.url} target="_blank" rel="noopener noreferrer" className={PULL_REQUEST_LINK_CLASS}>
                {`${item.repository}#${item.number}`}
              </a>
              {item.title ? <span className={PULL_REQUEST_TITLE_CLASS}>{item.title}</span> : null}
              {item.state ? <span className={cn('shrink-0 text-xs', PULL_REQUEST_STATE_CLASS[item.state])}>{t(`pullRequestState.${item.state}`)}</span> : null}
              {!readOnly && item.source === 'manual' ? (
                <button
                  type="button"
                  aria-label={t('unlinkPullRequest', { name: `${item.repository}#${item.number}` })}
                  disabled={unlink.isPending}
                  onClick={() => unlink.mutate(item.id)}
                  className="ml-auto shrink-0 rounded p-0.5 text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <X size={12} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
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
    </div>
  );
}
