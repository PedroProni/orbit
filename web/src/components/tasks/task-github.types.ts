import { GithubRef, GithubRefKind, PullRequestLink } from '@/types/api.types';

export interface TaskGithubPullRequestItemProps {
  item: PullRequestLink;
  readOnly: boolean;
  now: Date;
  unlinking: boolean;
  onUnlink: (linkId: string) => void;
}

export interface TaskGithubRefsProps {
  kind: GithubRefKind;
  refs: GithubRef[];
}

export interface TaskGithubSyncBarProps {
  taskId: string;
  readOnly: boolean;
  syncedAt: string | null;
  now: Date;
}

export interface TaskGithubAuthorProps {
  login: string;
  avatarUrl: string | null;
}
