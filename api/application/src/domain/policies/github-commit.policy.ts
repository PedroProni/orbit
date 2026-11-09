import { GITHUB_COMMIT_TITLE_MAX } from '@domain/constants/github-sync.constant';

export class GithubCommitPolicy {
  static title(message: string): string {
    const firstLine = (message.split('\n')[0] ?? '').trim();
    return firstLine.length > GITHUB_COMMIT_TITLE_MAX ? firstLine.slice(0, GITHUB_COMMIT_TITLE_MAX) : firstLine;
  }
}
