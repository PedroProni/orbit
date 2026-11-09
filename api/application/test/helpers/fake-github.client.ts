import { GithubClient } from '../../src/domain/services/github-client.service';
import { GithubPullRequest } from '../../src/domain/types/github-pull-request.type';
import { GithubCommit } from '../../src/domain/types/github-commit.type';
import { GithubBranch } from '../../src/domain/types/github-branch.type';
import { GithubCheckRun } from '../../src/domain/types/github-check-run.type';
import { GithubCombinedStatus } from '../../src/domain/types/github-combined-status.type';
import { GithubPullRequestNumber } from '../../src/domain/types/github-pull-request-number.type';
import { GITHUB_PAGE_SIZE } from '../../src/domain/constants/github-api.constant';

export class FakeGithubClient implements GithubClient {
  configured = false;
  pulls = new Map<string, GithubPullRequest[]>();
  branches = new Map<string, GithubBranch[]>();
  commits = new Map<string, GithubCommit[]>();
  pullCommits = new Map<string, GithubCommit[]>();
  checkRuns = new Map<string, GithubCheckRun[]>();
  statuses = new Map<string, GithubCombinedStatus>();
  calls: string[] = [];

  reset(): void {
    this.configured = false;
    for (const store of [this.pulls, this.branches, this.commits, this.pullCommits, this.checkRuns, this.statuses]) store.clear();
    this.calls = [];
  }

  isConfigured(): boolean {
    return this.configured;
  }

  listPullRequests(repository: string, page: number): Promise<GithubPullRequest[]> {
    this.calls.push(`pulls ${repository} ${page}`);
    const rows = [...(this.pulls.get(repository) ?? [])].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return Promise.resolve(rows.slice((page - 1) * GITHUB_PAGE_SIZE, page * GITHUB_PAGE_SIZE));
  }

  getPullRequest(repository: string, number: number): Promise<GithubPullRequest | null> {
    this.calls.push(`pull ${repository} ${number}`);
    return Promise.resolve((this.pulls.get(repository) ?? []).find(pr => pr.number === number) ?? null);
  }

  listPullRequestCommits(repository: string, number: number): Promise<GithubCommit[]> {
    this.calls.push(`pull-commits ${repository} ${number}`);
    return Promise.resolve(this.pullCommits.get(`${repository}#${number}`) ?? []);
  }

  listBranches(repository: string, page: number): Promise<GithubBranch[]> {
    this.calls.push(`branches ${repository} ${page}`);
    return Promise.resolve((this.branches.get(repository) ?? []).slice((page - 1) * GITHUB_PAGE_SIZE, page * GITHUB_PAGE_SIZE));
  }

  listCommits(repository: string, since: Date, page: number): Promise<GithubCommit[]> {
    this.calls.push(`commits ${repository} ${page}`);
    return Promise.resolve(
      (this.commits.get(repository) ?? []).filter(commit => !commit.committedAt || commit.committedAt.getTime() >= since.getTime()).slice((page - 1) * GITHUB_PAGE_SIZE, page * GITHUB_PAGE_SIZE),
    );
  }

  listCheckRuns(repository: string, sha: string): Promise<GithubCheckRun[]> {
    this.calls.push(`checks ${repository} ${sha}`);
    return Promise.resolve(this.checkRuns.get(sha) ?? []);
  }

  getCombinedStatus(repository: string, sha: string): Promise<GithubCombinedStatus> {
    this.calls.push(`status ${repository} ${sha}`);
    return Promise.resolve(this.statuses.get(sha) ?? { state: 'pending', totalCount: 0 });
  }

  searchPullRequests(repositories: string[], text: string): Promise<GithubPullRequestNumber[]> {
    this.calls.push(`search ${text}`);
    const found: GithubPullRequestNumber[] = [];
    for (const repository of repositories) {
      for (const pr of this.pulls.get(repository) ?? []) {
        if (`${pr.title} ${pr.body} ${pr.headRef}`.toLowerCase().includes(text.toLowerCase())) found.push({ repository, number: pr.number });
      }
    }
    return Promise.resolve(found);
  }
}
