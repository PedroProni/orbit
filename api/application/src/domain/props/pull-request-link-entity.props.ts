import { PullRequestLinkSource, PullRequestState } from '@domain/enums/pull-request-link.enums';
import { GithubChecksState } from '@domain/enums/github.enums';

export interface PullRequestLinkEntityProps {
  _id: string;
  workspaceId: string;
  taskId: string;
  repository: string;
  number: number;
  url: string;
  title: string;
  state: PullRequestState | null;
  source: PullRequestLinkSource;
  createdBy: string | null;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
  headRef: string | null;
  headSha: string | null;
  draft: boolean;
  checksState: GithubChecksState | null;
  githubUpdatedAt: Date | null;
  syncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
