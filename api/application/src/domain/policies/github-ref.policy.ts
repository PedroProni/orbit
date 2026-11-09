import { GITHUB_WEB_BASE_URL } from '@domain/constants/github-api.constant';
import { GithubRefKind } from '@domain/enums/github.enums';
import { GithubBranch } from '@domain/types/github-branch.type';
import { GithubCommit } from '@domain/types/github-commit.type';
import { GithubRefInput } from '@domain/types/github-ref-input.type';
import { GithubCommitPolicy } from '@domain/policies/github-commit.policy';

export class GithubRefPolicy {
  static branch(repository: string, branch: Pick<GithubBranch, 'name'>): GithubRefInput {
    return {
      repository,
      kind: GithubRefKind.BRANCH,
      key: branch.name,
      title: branch.name,
      url: `${GITHUB_WEB_BASE_URL}/${repository}/tree/${branch.name.split('/').map(encodeURIComponent).join('/')}`,
      authorLogin: null,
      occurredAt: null,
    };
  }

  static commit(repository: string, commit: GithubCommit): GithubRefInput {
    return {
      repository,
      kind: GithubRefKind.COMMIT,
      key: commit.sha.toLowerCase(),
      title: GithubCommitPolicy.title(commit.message),
      url: `${GITHUB_WEB_BASE_URL}/${repository}/commit/${commit.sha.toLowerCase()}`,
      authorLogin: commit.authorLogin,
      occurredAt: commit.committedAt,
    };
  }
}
