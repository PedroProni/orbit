import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PULL_REQUEST_LINK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { PULL_REQUEST_ACTIVITY_FIELD, PULL_REQUEST_LINKED_ACTION } from '@domain/constants/pull-request-link.constant';
import { DUPLICATE_KEY_CODE } from '@domain/constants/mongo-error.constant';
import { PullRequestLinkRepository } from '@domain/repositories/pull-request-link.repository';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { PullRequestLinkSource } from '@domain/enums/pull-request-link.enums';
import { GithubPullRequestUrlPolicy } from '@domain/policies/github-pull-request-url.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { TaskAccessService } from '@application/services/task-access.service';
import { PullRequestLinkPresenter } from '@application/presenters/pull-request-link.presenter';

@Injectable()
export class LinkTaskPullRequestUseCase {
  constructor(
    @Inject(PULL_REQUEST_LINK_INJECT_TOKEN) private readonly links: PullRequestLinkRepository,
    private readonly access: TaskAccessService,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string, url: string) {
    const task = await this.access.readable(principal, taskId);
    const ref = GithubPullRequestUrlPolicy.parse(url);
    if (!ref) throw new BadRequestException('Not a GitHub pull request link');
    const existing = await this.links.findForTask(task.getId(), ref.repository, ref.number);
    if (existing) return { created: false, link: PullRequestLinkPresenter.toView(existing) };
    const now = new Date();
    const entity = new PullRequestLinkEntity({
      _id: newId(),
      workspaceId: principal.workspaceId,
      taskId: task.getId(),
      repository: ref.repository,
      number: ref.number,
      url: ref.url,
      title: '',
      state: null,
      source: PullRequestLinkSource.MANUAL,
      createdBy: principal.userId,
      createdAt: now,
      updatedAt: now,
    });
    try {
      const saved = await this.links.create(entity);
      await this.audit.record(principal, PULL_REQUEST_LINKED_ACTION, 'task', task.getId(), {
        changed: [PULL_REQUEST_ACTIVITY_FIELD],
        diff: { [PULL_REQUEST_ACTIVITY_FIELD]: { before: null, after: GithubPullRequestUrlPolicy.label(ref.repository, ref.number) } },
      });
      return { created: true, link: PullRequestLinkPresenter.toView(saved) };
    } catch (error) {
      if ((error as { code?: number }).code !== DUPLICATE_KEY_CODE) throw error;
      const raced = await this.links.findForTask(task.getId(), ref.repository, ref.number);
      if (!raced) throw error;
      return { created: false, link: PullRequestLinkPresenter.toView(raced) };
    }
  }
}
