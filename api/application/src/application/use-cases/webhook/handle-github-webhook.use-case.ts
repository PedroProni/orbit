import { Inject, Injectable } from '@nestjs/common';
import { SPACE_INJECT_TOKEN, TASK_INJECT_TOKEN, WEBHOOK_DELIVERY_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskRepository } from '@domain/repositories/task.repository';
import { WebhookDeliveryRepository } from '@domain/repositories/webhook-delivery.repository';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { WebhookDeliveryEntity } from '@domain/entities/webhook-delivery.entity';
import { TaskEntity } from '@domain/entities/task.entity';
import { PullRequestLinkSource, PullRequestState } from '@domain/enums/pull-request-link.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { REVIEW_STATUS_NAME, GITHUB_ACTOR_ID } from '@domain/constants/github-webhook.constant';
import { GITHUB_BRANCH_REF_PREFIX, GITHUB_DATA_ACTIONS, GITHUB_EVENT, GITHUB_TRANSITION_ACTIONS } from '@domain/constants/github-webhook-event.constant';
import { GITHUB_SHA_PATTERN } from '@domain/constants/github-api.constant';
import { DUPLICATE_KEY_CODE } from '@domain/constants/mongo-error.constant';
import { DailyLogPolicy } from '@domain/policies/daily-log.policy';
import { TaskReferencePolicy } from '@domain/policies/task-reference.policy';
import { GithubRefPolicy } from '@domain/policies/github-ref.policy';
import { GithubPayloadMapper } from '@domain/mappers/github-payload.mapper';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { GithubPullRequestPayload } from '@domain/types/github-pull-request-payload.type';
import { GithubWebhookOutcome } from '@domain/types/github-webhook-outcome.type';
import { newId } from '@common/helpers/functions/id.helper';
import { CommentWriterService } from '@application/services/comment-writer.service';
import { PullRequestLinkWriterService } from '@application/services/pull-request-link-writer.service';
import { GithubRefWriterService } from '@application/services/github-ref-writer.service';
import { GithubSyncService } from '@application/services/github-sync.service';
import { UpdateTaskUseCase } from '@application/use-cases/task/update-task.use-case';

@Injectable()
export class HandleGithubWebhookUseCase {
  constructor(
    @Inject(WEBHOOK_DELIVERY_INJECT_TOKEN) private readonly deliveries: WebhookDeliveryRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    private readonly comments: CommentWriterService,
    private readonly updateTask: UpdateTaskUseCase,
    private readonly linkWriter: PullRequestLinkWriterService,
    private readonly refWriter: GithubRefWriterService,
    private readonly sync: GithubSyncService,
  ) {}

  async execute(deliveryId: string, event: string, payload: GithubPullRequestPayload): Promise<GithubWebhookOutcome> {
    if (!(await this.claim(deliveryId, event))) return { status: 'duplicate', linked: [] };
    const repository = payload.repository?.full_name;
    if (!repository) return { status: 'ignored', linked: [] };
    if (event === GITHUB_EVENT.PULL_REQUEST) return this.pullRequest(repository, payload);
    if (event === GITHUB_EVENT.PUSH) return this.push(repository, payload);
    if (event === GITHUB_EVENT.CREATE || event === GITHUB_EVENT.DELETE) return this.branchEvent(repository, payload, event === GITHUB_EVENT.DELETE);
    if (event === GITHUB_EVENT.CHECK_SUITE || event === GITHUB_EVENT.CHECK_RUN || event === GITHUB_EVENT.STATUS) {
      const sha = payload.check_suite?.head_sha ?? payload.check_run?.head_sha ?? payload.sha ?? '';
      const updated = await this.sync.refreshChecks(repository, sha);
      return { status: updated > 0 ? 'processed' : 'ignored', linked: [] };
    }
    return { status: 'ignored', linked: [] };
  }

  private async pullRequest(repository: string, payload: GithubPullRequestPayload): Promise<GithubWebhookOutcome> {
    const raw = payload.pull_request;
    const action = payload.action ?? '';
    const transition = (GITHUB_TRANSITION_ACTIONS as readonly string[]).includes(action);
    if (!raw || (!transition && !(GITHUB_DATA_ACTIONS as readonly string[]).includes(action))) return { status: 'ignored', linked: [] };
    const mapped = GithubPayloadMapper.pullRequest(repository, raw);
    const pr = transition ? { ...mapped, state: this.stateOf(action, raw.merged === true || Boolean(raw.merged_at)) } : mapped;
    const linked: string[] = [];
    const now = new Date();
    for (const taskId of TaskReferencePolicy.extract(pr.title, pr.body, pr.headRef)) {
      const task = await this.tasks.findOne({ _id: taskId });
      if (!task) continue;
      const write = await this.linkWriter.upsert(
        { _id: newId(), workspaceId: task.getWorkspaceId(), taskId, repository, number: pr.number, url: pr.url, source: PullRequestLinkSource.WEBHOOK, createdBy: null, now },
        link => link.applyGithub(pr, null, now),
      );
      linked.push(taskId);
      if (!transition) continue;
      const principal = this.principal(task);
      const state = write.link.getState();
      if (state === PullRequestState.OPEN && write.previous !== PullRequestState.OPEN) await this.moveToReview(principal, task.getId(), task.getSpaceId(), task.getStatus());
      if (state === PullRequestState.MERGED && write.previous !== PullRequestState.MERGED) {
        await this.comments.create(principal, taskId, `Merged into homolog on ${DailyLogPolicy.dateKey(now)} (${pr.url})`, []);
      }
    }
    return { status: 'processed', linked };
  }

  private async push(repository: string, payload: GithubPullRequestPayload): Promise<GithubWebhookOutcome> {
    const ref = payload.ref ?? '';
    if (!ref.startsWith(GITHUB_BRANCH_REF_PREFIX)) return { status: 'ignored', linked: [] };
    const branch = ref.slice(GITHUB_BRANCH_REF_PREFIX.length);
    if (payload.deleted === true) {
      await this.refWriter.removeBranch(repository, branch);
      return { status: 'processed', linked: [] };
    }
    const now = new Date();
    const linked = new Set<string>();
    const branchIds = TaskReferencePolicy.extract(branch);
    for (const id of branchIds) {
      const task = await this.tasks.findOne({ _id: id });
      if (!task) continue;
      await this.refWriter.record(task, GithubRefPolicy.branch(repository, { name: branch }), now);
      linked.add(id);
    }
    for (const commit of payload.commits ?? []) {
      const sha = commit.id ?? '';
      if (!GITHUB_SHA_PATTERN.test(sha)) continue;
      const input = GithubRefPolicy.commit(repository, {
        sha,
        message: commit.message ?? '',
        url: '',
        authorLogin: commit.author?.username ?? null,
        committedAt: commit.timestamp ? new Date(commit.timestamp) : null,
      });
      for (const id of new Set([...TaskReferencePolicy.extract(commit.message), ...branchIds])) {
        const task = await this.tasks.findOne({ _id: id });
        if (!task) continue;
        await this.refWriter.record(task, input, now);
        linked.add(id);
      }
    }
    return { status: 'processed', linked: [...linked] };
  }

  private async branchEvent(repository: string, payload: GithubPullRequestPayload, deleted: boolean): Promise<GithubWebhookOutcome> {
    const branch = payload.ref ?? '';
    if (payload.ref_type !== 'branch' || !branch) return { status: 'ignored', linked: [] };
    if (deleted) {
      await this.refWriter.removeBranch(repository, branch);
      return { status: 'processed', linked: [] };
    }
    const linked: string[] = [];
    for (const id of TaskReferencePolicy.extract(branch)) {
      const task = await this.tasks.findOne({ _id: id });
      if (!task) continue;
      await this.refWriter.record(task, GithubRefPolicy.branch(repository, { name: branch }), new Date());
      linked.push(id);
    }
    return { status: 'processed', linked };
  }

  private principal(task: TaskEntity): AuthPrincipal {
    return { workspaceId: task.getWorkspaceId(), actorType: AuditActorType.WEBHOOK, actorId: GITHUB_ACTOR_ID, userId: GITHUB_ACTOR_ID, role: UserRole.MEMBER, scopes: [] };
  }

  private async claim(deliveryId: string, event: string): Promise<boolean> {
    const now = new Date();
    try {
      await this.deliveries.create(new WebhookDeliveryEntity({ _id: newId(), deliveryId, event, createdAt: now, updatedAt: now }));
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY_CODE) return false;
      throw error;
    }
  }

  private stateOf(action: string, merged: boolean): PullRequestState {
    if (action === 'closed') return merged ? PullRequestState.MERGED : PullRequestState.CLOSED;
    return PullRequestState.OPEN;
  }

  private async moveToReview(principal: AuthPrincipal, taskId: string, spaceId: string, currentStatus: string): Promise<void> {
    const space = await this.spaces.findByIdInWorkspace(spaceId, principal.workspaceId);
    if (!space || !space.hasStatus(REVIEW_STATUS_NAME) || space.isClosedStatus(currentStatus) || currentStatus === REVIEW_STATUS_NAME) return;
    await this.updateTask.execute(principal, taskId, { status: REVIEW_STATUS_NAME });
  }
}
