import { Inject, Injectable } from '@nestjs/common';
import { PULL_REQUEST_LINK_INJECT_TOKEN, TASK_INJECT_TOKEN, WEBHOOK_DELIVERY_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { PullRequestLinkRepository } from '@domain/repositories/pull-request-link.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { WebhookDeliveryRepository } from '@domain/repositories/webhook-delivery.repository';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { WebhookDeliveryEntity } from '@domain/entities/webhook-delivery.entity';
import { PullRequestState } from '@domain/enums/pull-request-link.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { REVIEW_STATUS_NAME, GITHUB_ACTOR_ID } from '@domain/constants/github-webhook.constant';
import { DailyLogPolicy } from '@domain/policies/daily-log.policy';
import { TaskReferencePolicy } from '@domain/policies/task-reference.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { newId } from '@common/helpers/functions/id.helper';
import { SPACE_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { GithubPullRequestPayload } from '@domain/types/github-pull-request-payload.type';
import { GithubWebhookOutcome } from '@domain/types/github-webhook-outcome.type';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { CommentWriterService } from '@application/services/comment-writer.service';
import { UpdateTaskUseCase } from '@application/use-cases/task/update-task.use-case';

@Injectable()
export class HandleGithubWebhookUseCase {
  constructor(
    @Inject(WEBHOOK_DELIVERY_INJECT_TOKEN) private readonly deliveries: WebhookDeliveryRepository,
    @Inject(PULL_REQUEST_LINK_INJECT_TOKEN) private readonly links: PullRequestLinkRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    private readonly comments: CommentWriterService,
    private readonly updateTask: UpdateTaskUseCase,
  ) {}

  async execute(deliveryId: string, event: string, payload: GithubPullRequestPayload): Promise<GithubWebhookOutcome> {
    if (!(await this.claim(deliveryId, event))) return { status: 'duplicate', linked: [] };
    const pr = payload.pull_request;
    if (event !== 'pull_request' || !pr || !payload.repository?.full_name) return { status: 'ignored', linked: [] };
    const state = this.stateOf(payload.action, pr.merged === true);
    if (!state) return { status: 'ignored', linked: [] };
    const taskIds = TaskReferencePolicy.extract(pr.title, pr.head?.ref);
    const linked: string[] = [];
    for (const taskId of taskIds) {
      const task = await this.tasks.findOne({ _id: taskId });
      if (!task) continue;
      const principal: AuthPrincipal = { workspaceId: task.getWorkspaceId(), actorType: AuditActorType.WEBHOOK, actorId: GITHUB_ACTOR_ID, userId: GITHUB_ACTOR_ID, role: UserRole.MEMBER, scopes: [] };
      const repository = payload.repository.full_name;
      const url = pr.html_url ?? '';
      const title = pr.title ?? '';
      const existing = await this.links.findOne({ repository, number: pr.number, task_id: taskId });
      const previous = existing?.getState();
      if (existing) {
        existing.sync(title, url, state);
        await this.links.patch(existing, ['title', 'url', 'state']);
      } else {
        const now = new Date();
        await this.links.create(new PullRequestLinkEntity({ _id: newId(), workspaceId: task.getWorkspaceId(), taskId, repository, number: pr.number, url, title, state, createdAt: now, updatedAt: now }));
      }
      linked.push(taskId);
      if (state === PullRequestState.OPEN && previous !== PullRequestState.OPEN) await this.moveToReview(principal, task.getId(), task.getSpaceId(), task.getStatus());
      if (state === PullRequestState.MERGED && previous !== PullRequestState.MERGED) {
        await this.comments.create(principal, taskId, `Merged into homolog on ${DailyLogPolicy.dateKey(new Date())} (${url})`, []);
      }
    }
    return { status: 'processed', linked };
  }

  private async claim(deliveryId: string, event: string): Promise<boolean> {
    const now = new Date();
    try {
      await this.deliveries.create(new WebhookDeliveryEntity({ _id: newId(), deliveryId, event, createdAt: now, updatedAt: now }));
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return false;
      throw error;
    }
  }

  private stateOf(action: string | undefined, merged: boolean): PullRequestState | null {
    if (action === 'opened' || action === 'reopened' || action === 'ready_for_review') return PullRequestState.OPEN;
    if (action === 'closed') return merged ? PullRequestState.MERGED : PullRequestState.CLOSED;
    return null;
  }

  private async moveToReview(principal: AuthPrincipal, taskId: string, spaceId: string, currentStatus: string): Promise<void> {
    const space = await this.spaces.findByIdInWorkspace(spaceId, principal.workspaceId);
    if (!space || !space.hasStatus(REVIEW_STATUS_NAME) || space.isClosedStatus(currentStatus) || currentStatus === REVIEW_STATUS_NAME) return;
    await this.updateTask.execute(principal, taskId, { status: REVIEW_STATUS_NAME });
  }
}
