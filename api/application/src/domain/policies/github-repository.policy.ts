import { GITHUB_REPOSITORY_PATTERN } from '@domain/constants/github-api.constant';
import { GITHUB_DEFAULT_REPOSITORIES } from '@domain/constants/github-sync.constant';

export class GithubRepositoryPolicy {
  static parseList(raw: string | undefined | null): string[] {
    const source = raw === undefined || raw === null ? GITHUB_DEFAULT_REPOSITORIES : raw.split(',');
    const seen = new Set<string>();
    const list: string[] = [];
    for (const entry of source) {
      const name = entry.trim();
      if (!GITHUB_REPOSITORY_PATTERN.test(name) || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      list.push(name);
    }
    return list;
  }

  static isListed(list: string[], repository: string): boolean {
    const wanted = repository.toLowerCase();
    return list.some(name => name.toLowerCase() === wanted);
  }

  static key(repository: string): string {
    return repository.toLowerCase();
  }
}
