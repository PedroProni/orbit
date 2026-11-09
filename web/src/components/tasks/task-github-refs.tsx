'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, GitBranch, GitCommitHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GITHUB_REF_LINK_CLASS, GITHUB_REF_TOGGLE_CLASS, GITHUB_SHORT_SHA_LENGTH } from './task-github.constants';
import { repositoryName, safeGithubUrl } from './task-github.helpers';
import { TaskGithubRefsProps } from './task-github.types';

export function TaskGithubRefs({ kind, refs }: TaskGithubRefsProps) {
  const t = useTranslations('drawer');
  const [open, setOpen] = useState(false);
  if (!refs.length) return null;
  const label = kind === 'branch' ? t('githubBranches', { count: refs.length }) : t('githubCommits', { count: refs.length });
  const Icon = kind === 'branch' ? GitBranch : GitCommitHorizontal;
  return (
    <div className="min-w-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)} className={GITHUB_REF_TOGGLE_CLASS}>
        {open ? <ChevronDown size={12} aria-hidden="true" /> : <ChevronRight size={12} aria-hidden="true" />}
        <Icon size={12} aria-hidden="true" />
        {label}
      </button>
      {open ? (
        <ul aria-label={label} className="space-y-0.5 pl-5 text-xs">
          {refs.map((ref) => (
            <li key={ref.id} className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0 text-muted">{repositoryName(ref.repository)}</span>
              <a
                href={safeGithubUrl(ref.url)}
                target="_blank"
                rel="noopener noreferrer"
                title={ref.repository}
                className={kind === 'commit' ? 'shrink-0 font-mono text-accent hover:underline' : GITHUB_REF_LINK_CLASS}
              >
                {kind === 'commit' ? ref.key.slice(0, GITHUB_SHORT_SHA_LENGTH) : ref.key}
              </a>
              {kind === 'commit' && ref.title ? <span className="min-w-0 truncate">{ref.title}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
