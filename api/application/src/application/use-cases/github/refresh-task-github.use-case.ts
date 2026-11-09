import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { GITHUB_SYNC_STATE_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { GITHUB_REFRESH_COOLDOWN_MS } from '@domain/constants/github-sync.constant';
import { GITHUB_ERROR } from '@domain/constants/github-error.constant';
import { GithubSyncStateRepository } from '@domain/repositories/github-sync-state.repository';
import { GithubError } from '@domain/errors/github.error';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { TaskAccessService } from '@application/services/task-access.service';
import { GithubSyncService } from '@application/services/github-sync.service';
import { GetTaskGithubUseCase } from '@application/use-cases/github/get-task-github.use-case';

@Injectable()
export class RefreshTaskGithubUseCase {
  constructor(
    @Inject(GITHUB_SYNC_STATE_INJECT_TOKEN) private readonly states: GithubSyncStateRepository,
    private readonly access: TaskAccessService,
    private readonly sync: GithubSyncService,
    private readonly view: GetTaskGithubUseCase,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string) {
    const task = await this.access.readable(principal, taskId);
    if (!this.sync.isEnabled()) throw new GithubError(GITHUB_ERROR.NOT_CONFIGURED, 'refresh', HttpStatus.CONFLICT);
    const key = this.sync.taskKey(task.getId());
    if (!(await this.states.claim(key, new Date(), GITHUB_REFRESH_COOLDOWN_MS))) throw new GithubError(GITHUB_ERROR.REFRESH_COOLDOWN, 'refresh', HttpStatus.TOO_MANY_REQUESTS);
    await this.sync.refreshTask(task);
    await this.states.finish(key, new Date(), {});
    return this.view.execute(principal, task.getId());
  }
}
