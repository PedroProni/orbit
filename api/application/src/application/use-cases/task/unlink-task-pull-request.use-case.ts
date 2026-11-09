import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PULL_REQUEST_LINK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { PULL_REQUEST_ACTIVITY_FIELD, PULL_REQUEST_UNLINKED_ACTION } from '@domain/constants/pull-request-link.constant';
import { PullRequestLinkRepository } from '@domain/repositories/pull-request-link.repository';
import { GithubPullRequestUrlPolicy } from '@domain/policies/github-pull-request-url.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';
import { TaskAccessService } from '@application/services/task-access.service';

@Injectable()
export class UnlinkTaskPullRequestUseCase {
  constructor(
    @Inject(PULL_REQUEST_LINK_INJECT_TOKEN) private readonly links: PullRequestLinkRepository,
    private readonly access: TaskAccessService,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string, linkId: string): Promise<void> {
    const task = await this.access.readable(principal, taskId);
    const link = await this.links.findOne({ _id: linkId, workspace_id: principal.workspaceId, task_id: task.getId() });
    if (!link) throw new NotFoundException('Pull request link not found');
    if (!link.isManual()) throw new ConflictException('Pull requests linked by GitHub cannot be removed');
    await this.links.delete(link.getId());
    await this.audit.record(principal, PULL_REQUEST_UNLINKED_ACTION, 'task', task.getId(), {
      changed: [PULL_REQUEST_ACTIVITY_FIELD],
      diff: { [PULL_REQUEST_ACTIVITY_FIELD]: { before: GithubPullRequestUrlPolicy.label(link.getRepository(), link.getNumber()), after: null } },
    });
  }
}
