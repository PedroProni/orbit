import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AUTOMATION_INJECT_TOKEN, AUTOMATION_RUN_INJECT_TOKEN, TASK_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AutomationRepository } from '@domain/repositories/automation.repository';
import { AutomationRunRepository } from '@domain/repositories/automation-run.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { AutomationEntity } from '@domain/entities/automation.entity';
import { AutomationActionType, AutomationNotifyTarget, AutomationTriggerType } from '@domain/enums/automation.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AutomationSecret } from '@domain/types/automation-secret.type';
import { AutomationRewrite } from '@domain/types/automation-rewrite.type';
import { AutomationError } from '@domain/errors/automation.error';
import { WebhookUrlPolicy } from '@domain/policies/webhook-url.policy';
import { AUTOMATION_ERROR } from '@domain/constants/automation-error.constant';
import { AUTOMATION_RUNS_LIST_LIMIT } from '@domain/constants/automation.constant';
import { newId } from '@common/helpers/functions/id.helper';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { AuditService } from '@application/services/audit.service';
import { WorkspaceMembersService } from '@application/services/workspace-members.service';
import { AutomationSecretService } from '@application/services/automation-secret.service';
import { AutomationPresenter } from '@application/presenters/automation.presenter';
import { SaveAutomationDto } from '@shared/dtos/automation/save-automation.dto';
import { UpdateAutomationDto } from '@shared/dtos/automation/update-automation.dto';

@Injectable()
export class AutomationsUseCase {
  constructor(
    @Inject(AUTOMATION_INJECT_TOKEN) private readonly automations: AutomationRepository,
    @Inject(AUTOMATION_RUN_INJECT_TOKEN) private readonly runLog: AutomationRunRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly members: WorkspaceMembersService,
    private readonly audit: AuditService,
    private readonly secrets: AutomationSecretService,
    private readonly env: EnvConfigService,
  ) {}

  async list(principal: AuthPrincipal) {
    const automations = await this.automations.findMany({ workspace_id: principal.workspaceId }, { created_at: 1 });
    const lastRuns = await this.runLog.lastFinished(automations.map(a => a.getId()));
    return automations.map(a => AutomationPresenter.toView(a, lastRuns.get(a.getId()) ?? null));
  }

  async create(principal: AuthPrincipal, dto: SaveAutomationDto) {
    const input: AutomationRewrite = {
      listId: dto.listId ?? null,
      name: dto.name,
      triggerType: dto.triggerType,
      triggerValue: AutomationsUseCase.pick(dto.triggerValue, dto.triggerStatus, null),
      actionType: dto.actionType,
      actionValue: dto.actionValue,
      actionUserIds: dto.actionUserIds ?? [],
      active: dto.active ?? true,
    };
    await this.validate(principal, input);
    const now = new Date();
    const automation = new AutomationEntity({
      _id: newId(),
      workspaceId: principal.workspaceId,
      listId: null,
      name: input.name,
      triggerType: AutomationTriggerType.TASK_CREATED,
      triggerValue: null,
      actionType: input.actionType,
      actionValue: input.actionValue,
      actionUserIds: [],
      webhookSecretEnc: null,
      active: true,
      armedAt: now,
      dateCursor: null,
      createdBy: principal.userId,
      createdAt: now,
      updatedAt: now,
    });
    AutomationsUseCase.rewrite(automation, input, now);
    const secret = automation.getActionType() === AutomationActionType.WEBHOOK ? this.secrets.generate() : null;
    if (secret) automation.replaceSecret(secret.encrypted);
    const saved = await this.automations.create(automation);
    await this.audit.record(principal, 'automation.created', 'automation', saved.getId(), { triggerType: saved.getTriggerType(), actionType: saved.getActionType() });
    return AutomationsUseCase.withSecret(AutomationPresenter.toView(saved, null), secret);
  }

  async update(principal: AuthPrincipal, id: string, dto: UpdateAutomationDto) {
    const automation = await this.find(principal, id);
    const triggerType = dto.triggerType ?? automation.getTriggerType();
    const actionType = dto.actionType ?? automation.getActionType();
    const sameTrigger = triggerType === automation.getTriggerType();
    const sameAction = actionType === automation.getActionType();
    const input: AutomationRewrite = {
      listId: dto.listId !== undefined ? dto.listId : automation.getListId(),
      name: dto.name ?? automation.getName(),
      triggerType,
      triggerValue: AutomationsUseCase.pick(dto.triggerValue, dto.triggerStatus, sameTrigger ? automation.getTriggerValue() : null),
      actionType,
      actionValue: dto.actionValue ?? (sameAction ? automation.getActionValue() : ''),
      actionUserIds: dto.actionUserIds ?? (sameAction ? automation.getActionUserIds() : []),
      active: dto.active ?? automation.getActive(),
    };
    await this.validate(principal, input);
    AutomationsUseCase.rewrite(automation, input, new Date());
    const needsSecret = automation.getActionType() === AutomationActionType.WEBHOOK && (!automation.hasSecret() || dto.rotateSecret === true);
    const secret = needsSecret ? this.secrets.generate() : null;
    if (secret) automation.replaceSecret(secret.encrypted);
    const saved = await this.automations.update(automation);
    await this.audit.record(principal, 'automation.updated', 'automation', saved.getId(), {
      triggerType: saved.getTriggerType(),
      actionType: saved.getActionType(),
      active: saved.getActive(),
      secretIssued: secret !== null,
    });
    const lastRun = (await this.runLog.lastFinished([saved.getId()])).get(saved.getId()) ?? null;
    return AutomationsUseCase.withSecret(AutomationPresenter.toView(saved, lastRun), secret);
  }

  async remove(principal: AuthPrincipal, id: string) {
    await this.find(principal, id);
    await this.automations.delete(id);
    await this.runLog.removeForAutomation(id);
    await this.audit.record(principal, 'automation.deleted', 'automation', id, {});
  }

  async runs(principal: AuthPrincipal, id: string) {
    await this.find(principal, id);
    const runs = await this.runLog.recentFinished(id, AUTOMATION_RUNS_LIST_LIMIT);
    const taskIds = [...new Set(runs.map(run => run.getTaskId()))];
    const tasks = taskIds.length ? await this.tasks.findMany({ workspace_id: principal.workspaceId, _id: { $in: taskIds } }, { created_at: -1 }, taskIds.length) : [];
    const titles = new Map(tasks.map(task => [task.getId(), task.getTitle()]));
    return runs.map(run => AutomationPresenter.toRunView(run, titles.get(run.getTaskId()) ?? null));
  }

  private async validate(principal: AuthPrincipal, input: AutomationRewrite): Promise<void> {
    if (input.listId && !(await this.lists.findByIdInWorkspace(input.listId, principal.workspaceId))) throw new NotFoundException('List not found');
    const users: string[] = [];
    if (input.actionType === AutomationActionType.ASSIGN && input.actionValue.trim()) users.push(input.actionValue.trim());
    if (input.actionType === AutomationActionType.NOTIFY && (input.actionValue.trim() as AutomationNotifyTarget) === AutomationNotifyTarget.USERS) users.push(...input.actionUserIds);
    if (input.triggerType === AutomationTriggerType.ASSIGNEE_ADDED && input.triggerValue?.trim()) users.push(input.triggerValue.trim());
    if (users.length && !(await this.members.allActive(principal.workspaceId, users))) throw new NotFoundException('User not found');
    if (input.actionType !== AutomationActionType.WEBHOOK || !input.active) return;
    this.secrets.assertConfigured();
    const urlError = WebhookUrlPolicy.check(input.actionValue, this.env.isAutomationWebhookPrivateAllowed());
    if (urlError)
      throw new AutomationError(
        urlError,
        urlError === AUTOMATION_ERROR.WEBHOOK_URL_PRIVATE ? 'Webhook URL points to a private or local address' : 'Webhook URL must be a valid https URL without credentials',
      );
  }

  private async find(principal: AuthPrincipal, id: string): Promise<AutomationEntity> {
    const automation = await this.automations.findByIdInWorkspace(id, principal.workspaceId);
    if (!automation) throw new NotFoundException('Automation not found');
    return automation;
  }

  private static rewrite(automation: AutomationEntity, input: AutomationRewrite, now: Date): void {
    try {
      automation.rewrite(input, now);
    } catch (error) {
      throw new AutomationError(AUTOMATION_ERROR.INVALID, (error as Error).message);
    }
  }

  private static pick(value: string | null | undefined, legacy: string | null | undefined, fallback: string | null): string | null {
    if (value !== undefined) return value;
    if (legacy !== undefined) return legacy;
    return fallback;
  }

  private static withSecret<T extends object>(view: T, secret: AutomationSecret | null): T & { webhookSecret?: string } {
    return secret ? { ...view, webhookSecret: secret.plain } : view;
  }
}
