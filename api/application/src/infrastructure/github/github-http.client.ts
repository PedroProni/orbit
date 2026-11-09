import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { GithubClient } from '@domain/services/github-client.service';
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
import { GithubEtagEntry } from '@domain/types/github-etag-entry.type';
import { GITHUB_API_ACCEPT, GITHUB_API_TIMEOUT_MS, GITHUB_API_USER_AGENT, GITHUB_API_VERSION, GITHUB_CORE_RESOURCE, GITHUB_ETAG_CACHE_SIZE, GITHUB_HTTP_STATUS, GITHUB_PAGE_SIZE, GITHUB_RATE_LIMIT_FLOOR, GITHUB_REPOSITORY_PATTERN, GITHUB_SEARCH_RATE_LIMIT_FLOOR, GITHUB_SEARCH_RESOURCE, GITHUB_SHA_PATTERN } from '@domain/constants/github-api.constant';
import { GITHUB_ERROR } from '@domain/constants/github-error.constant';
import { GithubError } from '@domain/errors/github.error';
import { GithubPayloadMapper } from '@domain/mappers/github-payload.mapper';

@Injectable()
export class GithubHttpClient implements GithubClient {
  private readonly logger = new Logger(GithubHttpClient.name);
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly etags = new Map<string, GithubEtagEntry>();
  private readonly pausedUntil = new Map<string, number>();

  constructor(env: EnvConfigService) {
    this.token = env.getGithubToken();
    this.baseUrl = env.getGithubApiUrl();
  }

  isConfigured(): boolean {
    return this.token.length > 0;
  }

  async listPullRequests(repository: string, page: number): Promise<GithubPullRequest[]> {
    const rows = await this.list<GithubRawPullRequest>('pulls.list', `${this.repoPath(repository)}/pulls`, { state: 'all', sort: 'updated', direction: 'desc', per_page: GITHUB_PAGE_SIZE, page });
    return rows.map(row => GithubPayloadMapper.pullRequest(repository, row));
  }

  async getPullRequest(repository: string, number: number): Promise<GithubPullRequest | null> {
    const row = await this.get<GithubRawPullRequest>('pulls.get', `${this.repoPath(repository)}/pulls/${this.positive(number)}`, {});
    return row ? GithubPayloadMapper.pullRequest(repository, row) : null;
  }

  async listPullRequestCommits(repository: string, number: number): Promise<GithubCommit[]> {
    const rows = await this.get<GithubRawCommit[]>('pulls.commits', `${this.repoPath(repository)}/pulls/${this.positive(number)}/commits`, { per_page: GITHUB_PAGE_SIZE });
    return (rows ?? []).map(row => GithubPayloadMapper.commit(repository, row));
  }

  async listBranches(repository: string, page: number): Promise<GithubBranch[]> {
    const rows = await this.list<GithubRawBranch>('branches.list', `${this.repoPath(repository)}/branches`, { per_page: GITHUB_PAGE_SIZE, page });
    return rows.map(row => GithubPayloadMapper.branch(row));
  }

  async listCommits(repository: string, since: Date, page: number): Promise<GithubCommit[]> {
    const rows = await this.list<GithubRawCommit>('commits.list', `${this.repoPath(repository)}/commits`, { since: since.toISOString(), per_page: GITHUB_PAGE_SIZE, page });
    return rows.map(row => GithubPayloadMapper.commit(repository, row));
  }

  async listCheckRuns(repository: string, sha: string): Promise<GithubCheckRun[]> {
    const raw = await this.get<GithubRawCheckRuns>('checks.list', `${this.repoPath(repository)}/commits/${this.sha(sha)}/check-runs`, { per_page: GITHUB_PAGE_SIZE });
    return GithubPayloadMapper.checkRuns(raw);
  }

  async getCombinedStatus(repository: string, sha: string): Promise<GithubCombinedStatus> {
    const raw = await this.get<GithubRawCombinedStatus>('statuses.combined', `${this.repoPath(repository)}/commits/${this.sha(sha)}/status`, {});
    return GithubPayloadMapper.combinedStatus(raw);
  }

  async searchPullRequests(repositories: string[], text: string): Promise<GithubPullRequestNumber[]> {
    const scope = repositories.filter(name => GITHUB_REPOSITORY_PATTERN.test(name));
    if (!scope.length || !/^[0-9a-z]{1,40}$/i.test(text)) return [];
    const q = [text, 'is:pr', ...scope.map(name => `repo:${name}`)].join(' ');
    const raw = await this.get<GithubRawSearch>('search.issues', '/search/issues', { q, per_page: GITHUB_PAGE_SIZE }, GITHUB_SEARCH_RESOURCE);
    return GithubPayloadMapper.search(raw);
  }

  private async list<T>(route: string, path: string, query: Record<string, string | number>): Promise<T[]> {
    const rows = await this.get<T[]>(route, path, query);
    if (rows === null) throw new GithubError(GITHUB_ERROR.REPOSITORY_UNAVAILABLE, route, HttpStatus.BAD_GATEWAY, GITHUB_HTTP_STATUS.NOT_FOUND);
    return rows;
  }

  private async get<T>(route: string, path: string, query: Record<string, string | number>, resource = GITHUB_CORE_RESOURCE): Promise<T | null> {
    if (!this.isConfigured()) throw new GithubError(GITHUB_ERROR.NOT_CONFIGURED, route, HttpStatus.SERVICE_UNAVAILABLE);
    if ((this.pausedUntil.get(resource) ?? 0) > Date.now()) throw new GithubError(GITHUB_ERROR.RATE_LIMITED, route, HttpStatus.SERVICE_UNAVAILABLE);
    const search = new URLSearchParams(Object.entries(query).map(([key, value]) => [key, String(value)])).toString();
    const url = `${this.baseUrl}${path}${search ? `?${search}` : ''}`;
    const cached = this.etags.get(url);
    const headers: Record<string, string> = { Accept: GITHUB_API_ACCEPT, Authorization: `Bearer ${this.token}`, 'User-Agent': GITHUB_API_USER_AGENT, 'X-GitHub-Api-Version': GITHUB_API_VERSION };
    if (cached) headers['If-None-Match'] = cached.etag;
    let response: Response;
    try {
      response = await fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(GITHUB_API_TIMEOUT_MS) });
    } catch (error) {
      const timedOut = (error as Error).name === 'TimeoutError' || (error as Error).name === 'AbortError';
      this.logger.warn(`GitHub ${route} ${timedOut ? 'timed out' : 'unreachable'}`);
      throw new GithubError(timedOut ? GITHUB_ERROR.TIMEOUT : GITHUB_ERROR.REQUEST_FAILED, route, HttpStatus.BAD_GATEWAY);
    }
    this.trackRateLimit(response, resource);
    if (response.status === GITHUB_HTTP_STATUS.NOT_MODIFIED && cached) return cached.data as T;
    if (response.status === GITHUB_HTTP_STATUS.NOT_FOUND) return null;
    if (response.status === GITHUB_HTTP_STATUS.FORBIDDEN || response.status === GITHUB_HTTP_STATUS.TOO_MANY_REQUESTS) {
      if (response.headers.get('x-ratelimit-remaining') === '0' || response.status === GITHUB_HTTP_STATUS.TOO_MANY_REQUESTS) {
        this.logger.warn(`GitHub ${route} rate limited`);
        throw new GithubError(GITHUB_ERROR.RATE_LIMITED, route, HttpStatus.SERVICE_UNAVAILABLE, response.status);
      }
    }
    if (!response.ok) {
      this.logger.warn(`GitHub ${route} failed with ${response.status}`);
      throw new GithubError(GITHUB_ERROR.REQUEST_FAILED, route, HttpStatus.BAD_GATEWAY, response.status);
    }
    const data = (await response.json()) as T;
    const etag = response.headers.get('etag');
    if (etag) this.remember(url, { etag, data });
    return data;
  }

  private trackRateLimit(response: Response, resource: string): void {
    const remaining = Number(response.headers.get('x-ratelimit-remaining'));
    const reset = Number(response.headers.get('x-ratelimit-reset'));
    const floor = resource === GITHUB_SEARCH_RESOURCE ? GITHUB_SEARCH_RATE_LIMIT_FLOOR : GITHUB_RATE_LIMIT_FLOOR;
    if (!response.headers.has('x-ratelimit-remaining') || !Number.isFinite(remaining)) return;
    if (remaining < floor && Number.isFinite(reset) && reset > 0) this.pausedUntil.set(resource, reset * 1000);
  }

  private remember(url: string, entry: GithubEtagEntry): void {
    this.etags.delete(url);
    this.etags.set(url, entry);
    if (this.etags.size <= GITHUB_ETAG_CACHE_SIZE) return;
    const oldest = this.etags.keys().next().value;
    if (oldest !== undefined) this.etags.delete(oldest);
  }

  private repoPath(repository: string): string {
    if (!GITHUB_REPOSITORY_PATTERN.test(repository)) throw new GithubError(GITHUB_ERROR.REQUEST_FAILED, 'repository', HttpStatus.BAD_REQUEST);
    const [owner, name] = repository.split('/');
    return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  }

  private sha(value: string): string {
    if (!GITHUB_SHA_PATTERN.test(value)) throw new GithubError(GITHUB_ERROR.REQUEST_FAILED, 'sha', HttpStatus.BAD_REQUEST);
    return value;
  }

  private positive(value: number): number {
    if (!Number.isSafeInteger(value) || value <= 0) throw new GithubError(GITHUB_ERROR.REQUEST_FAILED, 'number', HttpStatus.BAD_REQUEST);
    return value;
  }
}
