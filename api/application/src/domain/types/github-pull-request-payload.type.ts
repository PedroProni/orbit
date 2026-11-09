import { GithubRawPullRequest } from '@domain/types/github-raw-pull-request.type';

export interface GithubPullRequestPayload {
  action?: string;
  ref?: string;
  ref_type?: string;
  sha?: string;
  deleted?: boolean;
  repository?: { full_name?: string };
  pull_request?: GithubRawPullRequest;
  commits?: Array<{ id?: string; message?: string; url?: string; timestamp?: string; author?: { username?: string; name?: string } }>;
  check_suite?: { head_sha?: string };
  check_run?: { head_sha?: string };
}
