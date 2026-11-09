import { BadRequestException, Injectable } from '@nestjs/common';
import { PULL_REQUEST_ACTIVITY_FIELD, PULL_REQUEST_LINKED_ACTION } from '@domain/constants/pull-request-link.constant';
import { PullRequestLinkSource } from '@domain/enums/pull-request-link.enums';
import { GithubPullRequestUrlPolicy } from '@domain/policies/github-pull-request-url.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { TaskAccessService } from '@application/services/task-access.service';
import { PullRequestLinkPresenter } from '@application/presenters/pull-request-link.presenter';
import { PullRequestLinkWriterService } from '@application/services/pull-request-link-writer.service';
import { GithubSyncService } from '@application/services/github-sync.service';

@Injectable()
export class LinkTaskPullRequestUseCase {
  constructor(
    private readonly access: TaskAccessService,
    private readonly audit: AuditService,
    private readonly writer: PullRequestLinkWriterService,
    private readonly sync: GithubSyncService,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string, url: string) {
    const task = await this.access.readable(principal, taskId);
    const ref = GithubPullRequestUrlPolicy.parse(url);
    if (!ref) throw new BadRequestException('Not a GitHub pull request link');
    const write = await this.writer.upsert(
      {
        _id: newId(),
        workspaceId: principal.workspaceId,
        taskId: task.getId(),
        repository: ref.repository,
        number: ref.number,
        url: ref.url,
        source: PullRequestLinkSource.MANUAL,
        createdBy: principal.userId,
        now: new Date(),
      },
      () => [],
    );
    if (!write.created) return { created: false, link: PullRequestLinkPresenter.toView(write.link) };
    await this.audit.record(principal, PULL_REQUEST_LINKED_ACTION, 'task', task.getId(), {
      changed: [PULL_REQUEST_ACTIVITY_FIELD],
      diff: { [PULL_REQUEST_ACTIVITY_FIELD]: { before: null, after: GithubPullRequestUrlPolicy.label(write.link.getRepository(), ref.number) } },
    });
    const enriched = await this.sync.enrichLink(write.link);
    return { created: true, link: PullRequestLinkPresenter.toView(enriched) };
  }
}
