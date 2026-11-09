import { Inject, Injectable } from '@nestjs/common';
import { PULL_REQUEST_LINK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { PullRequestLinkRepository } from '@domain/repositories/pull-request-link.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { TaskAccessService } from '@application/services/task-access.service';
import { PullRequestLinkPresenter } from '@application/presenters/pull-request-link.presenter';

@Injectable()
export class ListTaskPullRequestsUseCase {
  constructor(
    @Inject(PULL_REQUEST_LINK_INJECT_TOKEN) private readonly links: PullRequestLinkRepository,
    private readonly access: TaskAccessService,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string) {
    const task = await this.access.readable(principal, taskId);
    const rows = await this.links.findMany({ workspace_id: principal.workspaceId, task_id: task.getId() }, { created_at: -1 }, 200);
    return rows.map(row => PullRequestLinkPresenter.toView(row));
  }
}
