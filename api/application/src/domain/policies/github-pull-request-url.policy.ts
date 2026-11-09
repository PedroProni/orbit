import { GITHUB_PULL_REQUEST_URL_BASE, GITHUB_PULL_REQUEST_URL_MAX_LENGTH, GITHUB_PULL_REQUEST_URL_PATTERN } from '@domain/constants/github-pull-request-url.constant';
import { GithubPullRequestRef } from '@domain/types/github-pull-request-ref.type';

export class GithubPullRequestUrlPolicy {
  static parse(raw: string): GithubPullRequestRef | null {
    const value = raw.trim();
    if (value.length > GITHUB_PULL_REQUEST_URL_MAX_LENGTH) return null;
    const match = GITHUB_PULL_REQUEST_URL_PATTERN.exec(value);
    if (!match) return null;
    const [, owner, name, number] = match;
    if (name === '.' || name === '..' || owner.endsWith('-')) return null;
    const repository = `${owner}/${name.replace(/\.git$/i, '')}`;
    return { repository, number: Number(number), url: `${GITHUB_PULL_REQUEST_URL_BASE}/${repository}/pull/${number}` };
  }

  static label(repository: string, number: number): string {
    return `${repository}#${number}`;
  }
}
