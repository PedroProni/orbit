import { Inject, Injectable, Logger } from '@nestjs/common';
import { GITHUB_CLIENT_TOKEN, GITHUB_SYNC_STATE_INJECT_TOKEN, PULL_REQUEST_LINK_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { GITHUB_COMMIT_CURSOR_OVERLAP_MS, GITHUB_FIRST_SYNC_LOOKBACK_MS, GITHUB_OPEN_CHECKS_LIMIT, GITHUB_REPOSITORY_LOCK_MS, GITHUB_REPOSITORY_SYNC_KEY_PREFIX, GITHUB_SYNC_MAX_PAGES, GITHUB_TASK_REFRESH_KEY_PREFIX } from '@domain/constants/github-sync.constant';
import { GITHUB_PAGE_SIZE, GITHUB_SHA_PATTERN } from '@domain/constants/github-api.constant';
import { GITHUB_ERROR } from '@domain/constants/github-error.constant';
import { GithubClient } from '@domain/services/github-client.service';
import { GithubSyncStateRepository } from '@domain/repositories/github-sync-state.repository';
import { PullRequestLinkRepository } from '@domain/repositories/pull-request-link.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TaskEntity } from '@domain/entities/task.entity';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { GithubSyncStateEntity } from '@domain/entities/github-sync-state.entity';
import { PullRequestLinkSource, PullRequestState } from '@domain/enums/pull-request-link.enums';
import { GithubChecksState } from '@domain/enums/github.enums';
import { GithubError } from '@domain/errors/github.error';
import { GithubPullRequest } from '@domain/types/github-pull-request.type';
import { GithubSyncReport } from '@domain/types/github-sync-report.type';
import { GithubSyncResult } from '@domain/types/github-sync-result.type';
import { TaskReferencePolicy } from '@domain/policies/task-reference.policy';
import { GithubChecksPolicy } from '@domain/policies/github-checks.policy';
import { GithubRepositoryPolicy } from '@domain/policies/github-repository.policy';
import { GithubRefPolicy } from '@domain/policies/github-ref.policy';
import { newId } from '@common/helpers/functions/id.helper';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { PullRequestLinkWriterService } from '@application/services/pull-request-link-writer.service';
import { GithubRefWriterService } from '@application/services/github-ref-writer.service';

@Injectable()
export class GithubSyncService {
  private readonly logger = new Logger(GithubSyncService.name);

  constructor(
    @Inject(GITHUB_CLIENT_TOKEN) private readonly github: GithubClient,
    @Inject(GITHUB_SYNC_STATE_INJECT_TOKEN) private readonly states: GithubSyncStateRepository,
    @Inject(PULL_REQUEST_LINK_INJECT_TOKEN) private readonly links: PullRequestLinkRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly linkWriter: PullRequestLinkWriterService,
    private readonly refWriter: GithubRefWriterService,
    private readonly env: EnvConfigService,
  ) {}

  isEnabled(): boolean {
    return this.github.isConfigured() && this.repositories().length > 0;
  }

  repositories(): string[] {
    return this.env.getGithubRepositories();
  }

  isListed(repository: string): boolean {
    return GithubRepositoryPolicy.isListed(this.repositories(), repository);
  }

  repositoryKey(repository: string): string {
    return `${GITHUB_REPOSITORY_SYNC_KEY_PREFIX}${GithubRepositoryPolicy.key(repository)}`;
  }

  taskKey(taskId: string): string {
    return `${GITHUB_TASK_REFRESH_KEY_PREFIX}${taskId}`;
  }

  async syncAll(): Promise<GithubSyncReport[]> {
    if (!this.isEnabled()) return [];
    const reports: GithubSyncReport[] = [];
    for (const repository of this.repositories()) {
      const key = this.repositoryKey(repository);
      if (!(await this.states.claim(key, new Date(), GITHUB_REPOSITORY_LOCK_MS))) continue;
      try {
        const result = await this.syncRepository(repository, await this.states.findById(key), new Date());
        await this.states.finish(key, new Date(), result.cursors);
        reports.push(result.report);
      } catch (error) {
        this.logger.warn(`GitHub sync of ${repository} stopped: ${(error as Error).message}`);
        if ((error as GithubError).code === GITHUB_ERROR.RATE_LIMITED) break;
      } finally {
        await this.states.release(key);
      }
    }
    return reports;
  }

  async syncRepository(repository: string, state: GithubSyncStateEntity | null, startedAt: Date): Promise<GithubSyncResult> {
    const report: GithubSyncReport = { repository, pullRequests: 0, branches: 0, commits: 0, removedBranches: 0 };
    const tasks = new Map<string, TaskEntity | null>();
    const checks = new Map<string, GithubChecksState | null>();
    const pullCursor = state?.getPullCursor() ?? null;
    let newestPull = pullCursor;
    for (let page = 1; page <= GITHUB_SYNC_MAX_PAGES; page++) {
      const rows = await this.github.listPullRequests(repository, page);
      let reached = false;
      for (const pr of rows) {
        if (pullCursor && pr.updatedAt.getTime() < pullCursor.getTime()) {
          reached = true;
          break;
        }
        if (!newestPull || pr.updatedAt.getTime() > newestPull.getTime()) newestPull = pr.updatedAt;
        if (await this.applyPullRequest(pr, null, tasks, checks, startedAt)) report.pullRequests++;
      }
      if (reached || rows.length < GITHUB_PAGE_SIZE) break;
    }
    await this.refreshOpenLinks(repository, checks, startedAt);
    const branches = await this.syncBranches(repository, tasks, startedAt);
    report.branches = branches.recorded;
    report.removedBranches = branches.removed;
    report.commits = await this.syncCommits(repository, state?.getCommitCursor() ?? null, tasks, startedAt);
    return { report, cursors: { pullCursor: newestPull ?? undefined, commitCursor: startedAt } };
  }

  async refreshTask(task: TaskEntity): Promise<void> {
    const now = new Date();
    const tasks = new Map<string, TaskEntity | null>([[task.getId(), task]]);
    const checks = new Map<string, GithubChecksState | null>();
    const listed = this.repositories();
    const found = await this.github.searchPullRequests(listed, task.getId());
    const existing = await this.links.findMany({ task_id: task.getId() }, { created_at: -1 }, 200);
    const targets = new Map<string, { repository: string; number: number }>();
    for (const item of [...found, ...existing.map(link => ({ repository: link.getRepository(), number: link.getNumber() }))]) {
      if (!this.isListed(item.repository)) continue;
      targets.set(`${GithubRepositoryPolicy.key(item.repository)}#${item.number}`, { repository: this.linkWriter.canonical(item.repository), number: item.number });
    }
    for (const target of targets.values()) {
      const pr = await this.github.getPullRequest(target.repository, target.number);
      if (pr) await this.applyPullRequest({ ...pr, repository: target.repository }, task.getId(), tasks, checks, now);
    }
    for (const repository of listed) {
      try {
        await this.recordTaskBranches(task, repository, now);
      } catch (error) {
        if ((error as GithubError).code !== GITHUB_ERROR.REPOSITORY_UNAVAILABLE) throw error;
        this.logger.warn(`GitHub refresh skipped ${repository}: ${(error as Error).message}`);
      }
    }
  }

  async enrichLink(link: PullRequestLinkEntity): Promise<PullRequestLinkEntity> {
    if (!this.isEnabled() || !this.isListed(link.getRepository())) return link;
    try {
      const pr = await this.github.getPullRequest(this.linkWriter.canonical(link.getRepository()), link.getNumber());
      if (!pr) return link;
      const checks = pr.state === PullRequestState.OPEN ? await this.checksFor(pr.repository, pr.headSha, new Map()) : null;
      return await this.linkWriter.save(link, link.applyGithub(pr, checks, new Date()));
    } catch (error) {
      this.logger.warn(`GitHub enrichment of a linked pull request skipped: ${(error as Error).message}`);
      return link;
    }
  }

  async refreshChecks(repository: string, sha: string): Promise<number> {
    if (!this.isEnabled() || !this.isListed(repository) || !GITHUB_SHA_PATTERN.test(sha)) return 0;
    const rows = await this.links.findInRepository(repository, { head_sha: sha.toLowerCase() }, GITHUB_OPEN_CHECKS_LIMIT);
    if (!rows.length) return 0;
    const state = await this.checksFor(this.linkWriter.canonical(repository), sha, new Map());
    if (!state) return 0;
    const now = new Date();
    for (const link of rows) await this.linkWriter.save(link, link.applyChecks(state, now));
    return rows.length;
  }

  private async recordTaskBranches(task: TaskEntity, repository: string, now: Date): Promise<void> {
    for (let page = 1; page <= GITHUB_SYNC_MAX_PAGES; page++) {
      const rows = await this.github.listBranches(repository, page);
      for (const branch of rows) {
        if (TaskReferencePolicy.extract(branch.name).includes(task.getId())) await this.refWriter.record(task, GithubRefPolicy.branch(repository, branch), now);
      }
      if (rows.length < GITHUB_PAGE_SIZE) break;
    }
  }

  private async applyPullRequest(pr: GithubPullRequest, onlyTaskId: string | null, tasks: Map<string, TaskEntity | null>, checks: Map<string, GithubChecksState | null>, now: Date): Promise<boolean> {
    const linked = await this.links.findInRepository(pr.repository, { number: pr.number }, GITHUB_OPEN_CHECKS_LIMIT);
    const ids = new Set([...TaskReferencePolicy.extract(pr.title, pr.body, pr.headRef), ...linked.map(link => link.getTaskId())]);
    const targets: TaskEntity[] = [];
    for (const id of ids) {
      if (onlyTaskId && id !== onlyTaskId) continue;
      const task = await this.task(id, tasks);
      if (task) targets.push(task);
    }
    if (!targets.length) return false;
    const state = pr.state === PullRequestState.OPEN ? await this.checksFor(pr.repository, pr.headSha, checks) : null;
    for (const task of targets) {
      await this.linkWriter.upsert(
        { _id: newId(), workspaceId: task.getWorkspaceId(), taskId: task.getId(), repository: pr.repository, number: pr.number, url: pr.url, source: PullRequestLinkSource.SYNC, createdBy: null, now },
        link => link.applyGithub(pr, state, now),
      );
    }
    const commits = await this.github.listPullRequestCommits(pr.repository, pr.number);
    for (const commit of commits) {
      if (!GITHUB_SHA_PATTERN.test(commit.sha)) continue;
      for (const task of targets) await this.refWriter.record(task, GithubRefPolicy.commit(pr.repository, commit), now);
    }
    return true;
  }

  private async refreshOpenLinks(repository: string, checks: Map<string, GithubChecksState | null>, now: Date): Promise<void> {
    const rows = await this.links.findInRepository(repository, { $or: [{ state: PullRequestState.OPEN }, { state: null }] }, GITHUB_OPEN_CHECKS_LIMIT);
    for (const link of rows) {
      const sha = link.getHeadSha();
      if (sha && checks.has(sha)) continue;
      if (!sha || link.getState() === null) {
        const pr = await this.github.getPullRequest(repository, link.getNumber());
        if (!pr) continue;
        const state = pr.state === PullRequestState.OPEN ? await this.checksFor(repository, pr.headSha, checks) : null;
        await this.linkWriter.save(link, link.applyGithub(pr, state, now));
        continue;
      }
      const state = await this.checksFor(repository, sha, checks);
      if (state) await this.linkWriter.save(link, link.applyChecks(state, now));
    }
  }

  private async syncBranches(repository: string, tasks: Map<string, TaskEntity | null>, now: Date): Promise<{ recorded: number; removed: number }> {
    const listedAt = new Date();
    const names: string[] = [];
    let recorded = 0;
    let complete = false;
    for (let page = 1; page <= GITHUB_SYNC_MAX_PAGES; page++) {
      const rows = await this.github.listBranches(repository, page);
      for (const branch of rows) {
        names.push(branch.name);
        for (const id of TaskReferencePolicy.extract(branch.name)) {
          const task = await this.task(id, tasks);
          if (!task) continue;
          await this.refWriter.record(task, GithubRefPolicy.branch(repository, branch), now);
          recorded++;
        }
      }
      if (rows.length < GITHUB_PAGE_SIZE) {
        complete = true;
        break;
      }
    }
    const removed = complete ? await this.refWriter.removeBranchesNotIn(repository, names, listedAt) : 0;
    return { recorded, removed };
  }

  private async syncCommits(repository: string, cursor: Date | null, tasks: Map<string, TaskEntity | null>, startedAt: Date): Promise<number> {
    const since = cursor ? new Date(cursor.getTime() - GITHUB_COMMIT_CURSOR_OVERLAP_MS) : new Date(startedAt.getTime() - GITHUB_FIRST_SYNC_LOOKBACK_MS);
    let recorded = 0;
    for (let page = 1; page <= GITHUB_SYNC_MAX_PAGES; page++) {
      const rows = await this.github.listCommits(repository, since, page);
      for (const commit of rows) {
        if (!GITHUB_SHA_PATTERN.test(commit.sha)) continue;
        for (const id of TaskReferencePolicy.extract(commit.message)) {
          const task = await this.task(id, tasks);
          if (!task) continue;
          await this.refWriter.record(task, GithubRefPolicy.commit(repository, commit), startedAt);
          recorded++;
        }
      }
      if (rows.length < GITHUB_PAGE_SIZE) break;
    }
    return recorded;
  }

  private async checksFor(repository: string, sha: string, cache: Map<string, GithubChecksState | null>): Promise<GithubChecksState | null> {
    if (!sha || !GITHUB_SHA_PATTERN.test(sha)) return null;
    if (cache.has(sha)) return cache.get(sha) ?? null;
    const [runs, combined] = await Promise.all([this.github.listCheckRuns(repository, sha), this.github.getCombinedStatus(repository, sha)]);
    const state = GithubChecksPolicy.summarize(runs, combined);
    cache.set(sha, state);
    return state;
  }

  private async task(id: string, cache: Map<string, TaskEntity | null>): Promise<TaskEntity | null> {
    if (cache.has(id)) return cache.get(id) ?? null;
    const task = await this.tasks.findOne({ _id: id });
    cache.set(id, task);
    return task;
  }
}
