'use client';

import { GitPullRequest, X } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { PULL_REQUEST_LINK_CLASS, PULL_REQUEST_STATE_CLASS, PULL_REQUEST_TITLE_CLASS } from './task-link-slots.constants';
import { GITHUB_CHECKS_CLASS, GITHUB_CHECKS_ICON, GITHUB_DRAFT_CLASS, GITHUB_META_CLASS } from './task-github.constants';
import { TaskGithubAuthor } from './task-github-author';
import { notAfter } from './task-github.helpers';
import { TaskGithubPullRequestItemProps } from './task-github.types';

export function TaskGithubPullRequestItem({ item, readOnly, now, unlinking, onUnlink }: TaskGithubPullRequestItemProps) {
  const t = useTranslations('drawer');
  const format = useFormatter();
  const name = `${item.repository}#${item.number}`;
  const checks = item.checksState && item.checksState !== 'none' ? item.checksState : null;
  const ChecksIcon = checks ? GITHUB_CHECKS_ICON[checks] : null;
  const hasMeta = !!item.authorLogin || item.draft || !!item.githubUpdatedAt;
  return (
    <li className="group min-w-0 px-1.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <GitPullRequest size={13} aria-hidden="true" className={cn('shrink-0', item.state ? PULL_REQUEST_STATE_CLASS[item.state] : 'text-muted')} />
        <a href={item.url} target="_blank" rel="noopener noreferrer" className={PULL_REQUEST_LINK_CLASS}>
          {name}
        </a>
        {item.title ? <span className={PULL_REQUEST_TITLE_CLASS}>{item.title}</span> : null}
        {item.state ? <span className={cn('shrink-0 text-xs', PULL_REQUEST_STATE_CLASS[item.state])}>{t(`pullRequestState.${item.state}`)}</span> : null}
        {checks && ChecksIcon ? (
          <span role="img" aria-label={t(`githubChecks.${checks}`)} title={t(`githubChecks.${checks}`)} className={cn('shrink-0', GITHUB_CHECKS_CLASS[checks])}>
            <ChecksIcon size={13} aria-hidden="true" />
          </span>
        ) : null}
        {!readOnly && item.source === 'manual' ? (
          <button
            type="button"
            aria-label={t('unlinkPullRequest', { name })}
            disabled={unlinking}
            onClick={() => onUnlink(item.id)}
            className="ml-auto shrink-0 rounded p-0.5 text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
          >
            <X size={12} />
          </button>
        ) : null}
      </div>
      {hasMeta ? (
        <div className={GITHUB_META_CLASS}>
          {item.authorLogin ? <TaskGithubAuthor login={item.authorLogin} avatarUrl={item.authorAvatarUrl} /> : null}
          {item.draft ? <span className={GITHUB_DRAFT_CLASS}>{t('githubDraft')}</span> : null}
          {item.githubUpdatedAt ? (
            <time dateTime={item.githubUpdatedAt} className="shrink-0">
              {t('githubUpdated', { time: format.relativeTime(notAfter(item.githubUpdatedAt, now), now) })}
            </time>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
