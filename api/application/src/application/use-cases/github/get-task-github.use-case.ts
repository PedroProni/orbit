import { Inject, Injectable } from '@nestjs/common';
import { GITHUB_REF_INJECT_TOKEN, GITHUB_SYNC_STATE_INJECT_TOKEN, PULL_REQUEST_LINK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { GITHUB_TASK_REFS_LIMIT } from '@domain/constants/github-sync.constant';
import { PullRequestLinkRepository } from '@domain/repositories/pull-request-link.repository';
import { GithubRefRepository } from '@domain/repositories/github-ref.repository';
import { GithubSyncStateRepository } from '@domain/repositories/github-sync-state.repository';
import { GithubRefKind } from '@domain/enums/github.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { TaskAccessService } from '@application/services/task-access.service';
import { GithubSyncService } from '@application/services/github-sync.service';
import { PullRequestLinkPresenter } from '@application/presenters/pull-request-link.presenter';
import { GithubRefPresenter } from '@application/presenters/github-ref.presenter';

@Injectable()
export class GetTaskGithubUseCase {
  constructor(
    @Inject(PULL_REQUEST_LINK_INJECT_TOKEN) private readonly links: PullRequestLinkRepository,
    @Inject(GITHUB_REF_INJECT_TOKEN) private readonly refs: GithubRefRepository,
    @Inject(GITHUB_SYNC_STATE_INJECT_TOKEN) private readonly states: GithubSyncStateRepository,
    private readonly access: TaskAccessService,
    private readonly sync: GithubSyncService,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string) {
    const task = await this.access.readable(principal, taskId);
    const scope = { workspace_id: principal.workspaceId, task_id: task.getId() };
    const keys = [this.sync.taskKey(task.getId()), ...this.sync.repositories().map(name => this.sync.repositoryKey(name))];
    const [links, branches, commits, syncedAt] = await Promise.all([
      this.links.findMany(scope, { created_at: -1 }, 200),
      this.refs.findMany({ ...scope, kind: GithubRefKind.BRANCH }, { key: 1 }, GITHUB_TASK_REFS_LIMIT),
      this.refs.findMany({ ...scope, kind: GithubRefKind.COMMIT }, { occurred_at: -1, created_at: -1 }, GITHUB_TASK_REFS_LIMIT),
      this.states.lastSuccess(keys),
    ]);
    return {
      pullRequests: links.map(link => PullRequestLinkPresenter.toView(link)),
      branches: branches.map(ref => GithubRefPresenter.toView(ref)),
      commits: commits.map(ref => GithubRefPresenter.toView(ref)),
      syncEnabled: this.sync.isEnabled(),
      syncedAt,
    };
  }
}
