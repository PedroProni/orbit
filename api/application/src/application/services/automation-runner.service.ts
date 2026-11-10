import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Subscription } from 'rxjs';
import { AUTOMATION_INJECT_TOKEN, AUTOMATION_RUN_INJECT_TOKEN, AUTOMATION_WEBHOOK_SENDER_TOKEN, SPACE_INJECT_TOKEN, TASK_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AutomationRepository } from '@domain/repositories/automation.repository';
import { AutomationRunRepository } from '@domain/repositories/automation-run.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { AutomationWebhookSender } from '@domain/services/automation-webhook-sender.service';
import { AutomationEntity } from '@domain/entities/automation.entity';
import { AutomationRunEntity } from '@domain/entities/automation-run.entity';
import { TaskEntity } from '@domain/entities/task.entity';
import { AutomationActionType, AutomationNotifyTarget } from '@domain/enums/automation.enums';
import { AutomationRunStatus } from '@domain/enums/automation-run.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { NotificationType } from '@domain/enums/notification.enums';
import { TaskPriority } from '@domain/enums/task.enums';
import { UserRole, UserStatus } from '@domain/enums/user.enums';
import { AutomationMatchPolicy } from '@domain/policies/automation-match.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AutomationRunOutcome } from '@domain/types/automation-run-outcome.type';
import { TaskEvent } from '@domain/types/task-event.type';
import { AUTOMATION_ACTOR_ID } from '@domain/constants/automation-actor.constant';
import { AUTOMATION_RUN_REASON } from '@domain/constants/automation-run-reason.constant';
import { newId } from '@common/helpers/functions/id.helper';
import { RealtimeService } from '@application/services/realtime.service';
import { CommentWriterService } from '@application/services/comment-writer.service';
import { NotificationService } from '@application/services/notification.service';
import { GuestAccessService } from '@application/services/guest-access.service';
import { AutomationSecretService } from '@application/services/automation-secret.service';
import { UpdateTaskUseCase } from '@application/use-cases/task/update-task.use-case';

@Injectable()
export class AutomationRunner implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationRunner.name);
  private subscription: Subscription | null = null;

  constructor(
    @Inject(AUTOMATION_INJECT_TOKEN) private readonly automations: AutomationRepository,
    @Inject(AUTOMATION_RUN_INJECT_TOKEN) private readonly runs: AutomationRunRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(AUTOMATION_WEBHOOK_SENDER_TOKEN) private readonly webhooks: AutomationWebhookSender,
    private readonly realtime: RealtimeService,
    private readonly updateTask: UpdateTaskUseCase,
    private readonly comments: CommentWriterService,
    private readonly notifications: NotificationService,
    private readonly guests: GuestAccessService,
    private readonly secrets: AutomationSecretService,
  ) {}

  onModuleInit(): void {
    this.subscription = this.realtime.all().subscribe(event => void this.handle(event));
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  async handle(event: TaskEvent): Promise<number> {
    const types = AutomationMatchPolicy.candidateTypes(event);
    if (!types.length || !event.eventId) return 0;
    try {
      const candidates = await this.automations.findMany({ workspace_id: event.workspaceId, active: true, trigger_type: { $in: types } }, { created_at: 1 });
      const matching = candidates.filter(automation => AutomationMatchPolicy.matches(automation, event));
      for (const automation of matching) await this.fire(automation, event.taskId, `event:${event.eventId}`);
      return matching.length;
    } catch (error) {
      this.logger.warn(`Automation event ${event.eventId} failed: ${(error as Error).message}`);
      return 0;
    }
  }

  async fire(automation: AutomationEntity, taskId: string, triggerKey: string): Promise<boolean> {
    const now = new Date();
    const run = new AutomationRunEntity({
      _id: newId(),
      workspaceId: automation.getWorkspaceId(),
      automationId: automation.getId(),
      triggerKey,
      taskId,
      status: AutomationRunStatus.RUNNING,
      reason: null,
      createdAt: now,
      updatedAt: now,
    });
    if (!(await this.runs.claim(run))) return false;
    let outcome: AutomationRunOutcome;
    try {
      outcome = await this.act(automation, taskId, run.getId());
    } catch (error) {
      this.logger.warn(`Automation ${automation.getId()} failed on task ${taskId}: ${(error as Error).message}`);
      outcome = { status: AutomationRunStatus.FAILED, reason: AUTOMATION_RUN_REASON.ERROR };
    }
    await this.runs.finish(run.getId(), outcome.status, outcome.reason);
    return true;
  }

  private async act(automation: AutomationEntity, taskId: string, runId: string): Promise<AutomationRunOutcome> {
    const task = await this.tasks.findByIdInWorkspace(taskId, automation.getWorkspaceId());
    if (!task) return AutomationRunner.skipped(AUTOMATION_RUN_REASON.TASK_NOT_FOUND);
    const principal = AutomationRunner.principal(automation.getWorkspaceId());
    const value = automation.getActionValue();
    switch (automation.getActionType()) {
      case AutomationActionType.ASSIGN:
        if (task.getAssigneeIds().includes(value)) return AutomationRunner.skipped(AUTOMATION_RUN_REASON.NO_CHANGE);
        await this.updateTask.execute(principal, taskId, { addAssigneeIds: [value] });
        return AutomationRunner.done();
      case AutomationActionType.ADD_TAG:
        if (task.getTags().includes(value.toLowerCase())) return AutomationRunner.skipped(AUTOMATION_RUN_REASON.NO_CHANGE);
        await this.updateTask.execute(principal, taskId, { addTags: [value] });
        return AutomationRunner.done();
      case AutomationActionType.SET_PRIORITY:
        if (task.getPriority() === (value as TaskPriority)) return AutomationRunner.skipped(AUTOMATION_RUN_REASON.NO_CHANGE);
        await this.updateTask.execute(principal, taskId, { priority: value as TaskPriority });
        return AutomationRunner.done();
      case AutomationActionType.SET_STATUS:
        return this.setStatus(principal, task, value);
      case AutomationActionType.COMMENT:
        await this.comments.create(principal, taskId, value, []);
        return AutomationRunner.done();
      case AutomationActionType.NOTIFY:
        return this.notify(automation, task);
      case AutomationActionType.WEBHOOK:
        return this.webhook(automation, task, runId);
      default:
        return AutomationRunner.skipped(AUTOMATION_RUN_REASON.NO_CHANGE);
    }
  }

  private async setStatus(principal: AuthPrincipal, task: TaskEntity, name: string): Promise<AutomationRunOutcome> {
    const space = await this.spaces.findByIdInWorkspace(task.getSpaceId(), task.getWorkspaceId());
    const status = space?.resolveStatus(name) ?? null;
    if (!status) return AutomationRunner.skipped(AUTOMATION_RUN_REASON.STATUS_NOT_IN_SPACE);
    if (status === task.getStatus()) return AutomationRunner.skipped(AUTOMATION_RUN_REASON.NO_CHANGE);
    await this.updateTask.execute(principal, task.getId(), { status });
    return AutomationRunner.done();
  }

  private async notify(automation: AutomationEntity, task: TaskEntity): Promise<AutomationRunOutcome> {
    const target = automation.getActionValue() as AutomationNotifyTarget;
    const wanted = target === AutomationNotifyTarget.ASSIGNEES ? task.getAssigneeIds() : target === AutomationNotifyTarget.WATCHERS ? task.getWatcherIds() : automation.getActionUserIds();
    const recipients = await this.readers(task, wanted);
    if (!recipients.length) return AutomationRunner.skipped(AUTOMATION_RUN_REASON.NO_CHANGE);
    await this.notifications.notify(task.getWorkspaceId(), recipients, NotificationType.AUTOMATION, task.getId(), AUTOMATION_ACTOR_ID);
    return AutomationRunner.done();
  }

  private async readers(task: TaskEntity, userIds: string[]): Promise<string[]> {
    const unique = [...new Set(userIds)];
    if (!unique.length) return [];
    const users = await this.users.findMany({ workspace_id: task.getWorkspaceId(), _id: { $in: unique }, status: UserStatus.ACTIVE });
    const allowed: string[] = [];
    for (const user of users) {
      const lists = await this.guests.allowedListIds({
        workspaceId: task.getWorkspaceId(),
        actorType: AuditActorType.USER,
        actorId: user.getId(),
        userId: user.getId(),
        role: user.getRole(),
        scopes: [],
      });
      if (!lists || lists.includes(task.getListId())) allowed.push(user.getId());
    }
    return allowed;
  }

  private async webhook(automation: AutomationEntity, task: TaskEntity, runId: string): Promise<AutomationRunOutcome> {
    const secret = this.secrets.reveal(automation.getWebhookSecretEnc());
    if (!secret) return { status: AutomationRunStatus.FAILED, reason: AUTOMATION_RUN_REASON.ERROR };
    return this.webhooks.send(automation.getActionValue(), secret, {
      delivery: runId,
      automationId: automation.getId(),
      trigger: automation.getTriggerType(),
      at: new Date().toISOString(),
      task: { id: task.getId(), title: task.getTitle(), status: task.getStatus(), priority: task.getPriority(), listId: task.getListId(), spaceId: task.getSpaceId() },
    });
  }

  private static principal(workspaceId: string): AuthPrincipal {
    return { workspaceId, actorType: AuditActorType.SYSTEM, actorId: AUTOMATION_ACTOR_ID, userId: AUTOMATION_ACTOR_ID, role: UserRole.MEMBER, scopes: [] };
  }

  private static done(): AutomationRunOutcome {
    return { status: AutomationRunStatus.DONE, reason: null };
  }

  private static skipped(reason: string): AutomationRunOutcome {
    return { status: AutomationRunStatus.SKIPPED, reason };
  }
}
