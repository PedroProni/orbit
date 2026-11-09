import { PullRequestState } from '@domain/enums/pull-request-link.enums';
import { GITHUB_WEB_BASE_URL } from '@domain/constants/github-api.constant';
import { GithubPullRequest } from '@domain/types/github-pull-request.type';
import { GithubCommit } from '@domain/types/github-commit.type';
import { GithubBranch } from '@domain/types/github-branch.type';
import { GithubCheckRun } from '@domain/types/github-check-run.type';
import { GithubCombinedStatus } from '@domain/types/github-combined-status.type';
import { GithubPullRequestNumber } from '@domain/types/github-pull-request-number.type';
import { GithubRawPullRequest } from '@domain/types/github-raw-pull-request.type';
import { GithubRawCommit } from '@domain/types/github-raw-commit.type';
import { GithubRawBranch } from '@domain/types/github-raw-branch.type';
import { GithubRawCheckRuns } from '@domain/types/github-raw-check-runs.type';
import { GithubRawCombinedStatus } from '@domain/types/github-raw-combined-status.type';
import { GithubRawSearch } from '@domain/types/github-raw-search.type';

export class GithubPayloadMapper {
  static pullRequest(repository: string, raw: GithubRawPullRequest): GithubPullRequest {
    return {
      repository,
      number: raw.number,
      title: raw.title ?? '',
      body: raw.body ?? '',
      url: raw.html_url ?? `${GITHUB_WEB_BASE_URL}/${repository}/pull/${raw.number}`,
      state: raw.merged_at || raw.merged === true ? PullRequestState.MERGED : raw.state === 'closed' ? PullRequestState.CLOSED : PullRequestState.OPEN,
      draft: raw.draft === true,
      authorLogin: raw.user?.login ?? null,
      authorAvatarUrl: raw.user?.avatar_url ?? null,
      headRef: raw.head?.ref ?? '',
      headSha: raw.head?.sha ?? '',
      updatedAt: raw.updated_at ? new Date(raw.updated_at) : new Date(0),
    };
  }

  static commit(repository: string, raw: GithubRawCommit): GithubCommit {
    const date = raw.commit?.committer?.date ?? raw.commit?.author?.date;
    return {
      sha: raw.sha,
      message: raw.commit?.message ?? '',
      url: raw.html_url ?? `${GITHUB_WEB_BASE_URL}/${repository}/commit/${raw.sha}`,
      authorLogin: raw.author?.login ?? null,
      committedAt: date ? new Date(date) : null,
    };
  }

  static branch(raw: GithubRawBranch): GithubBranch {
    return { name: raw.name, sha: raw.commit?.sha ?? '' };
  }

  static checkRuns(raw: GithubRawCheckRuns | null): GithubCheckRun[] {
    return (raw?.check_runs ?? []).map(run => ({ status: run.status ?? '', conclusion: run.conclusion ?? null }));
  }

  static combinedStatus(raw: GithubRawCombinedStatus | null): GithubCombinedStatus {
    return { state: raw?.state ?? '', totalCount: raw?.total_count ?? 0 };
  }

  static search(raw: GithubRawSearch | null): GithubPullRequestNumber[] {
    const found: GithubPullRequestNumber[] = [];
    for (const item of raw?.items ?? []) {
      if (!item.pull_request || !item.repository_url) continue;
      const parts = item.repository_url.split('/');
      if (parts.length < 2) continue;
      found.push({ repository: `${parts[parts.length - 2]}/${parts[parts.length - 1]}`, number: item.number });
    }
    return found;
  }
}
