import { PullRequestState } from '@domain/enums/pull-request-link.enums';

export interface GithubPullRequest {
  repository: string;
  number: number;
  title: string;
  body: string;
  url: string;
  state: PullRequestState;
  draft: boolean;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
  headRef: string;
  headSha: string;
  updatedAt: Date;
}
