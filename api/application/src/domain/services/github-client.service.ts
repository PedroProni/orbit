import { GithubPullRequest } from '@domain/types/github-pull-request.type';
import { GithubBranch } from '@domain/types/github-branch.type';
import { GithubCommit } from '@domain/types/github-commit.type';
import { GithubCheckRun } from '@domain/types/github-check-run.type';
import { GithubCombinedStatus } from '@domain/types/github-combined-status.type';
import { GithubPullRequestNumber } from '@domain/types/github-pull-request-number.type';

export interface GithubClient {
  isConfigured(): boolean;
  listPullRequests(repository: string, page: number): Promise<GithubPullRequest[]>;
  getPullRequest(repository: string, number: number): Promise<GithubPullRequest | null>;
  listPullRequestCommits(repository: string, number: number): Promise<GithubCommit[]>;
  listBranches(repository: string, page: number): Promise<GithubBranch[]>;
  listCommits(repository: string, since: Date, page: number): Promise<GithubCommit[]>;
  listCheckRuns(repository: string, sha: string): Promise<GithubCheckRun[]>;
  getCombinedStatus(repository: string, sha: string): Promise<GithubCombinedStatus>;
  searchPullRequests(repositories: string[], text: string): Promise<GithubPullRequestNumber[]>;
}
