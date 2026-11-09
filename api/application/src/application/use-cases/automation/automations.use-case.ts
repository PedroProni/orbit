import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AUTOMATION_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AutomationRepository } from '@domain/repositories/automation.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { AutomationEntity } from '@domain/entities/automation.entity';
import { AutomationActionType, AutomationTriggerType } from '@domain/enums/automation.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { WorkspaceMembersService } from '@application/services/workspace-members.service';
import { SaveAutomationDto } from '@shared/dtos/automation/save-automation.dto';

@Injectable()
export class AutomationsUseCase {
  constructor(
    @Inject(AUTOMATION_INJECT_TOKEN) private readonly automations: AutomationRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    private readonly members: WorkspaceMembersService,
    private readonly audit: AuditService,
  ) {}

  async list(principal: AuthPrincipal) {
    return (await this.automations.findMany({ workspace_id: principal.workspaceId }, { created_at: 1 })).map(AutomationsUseCase.view);
  }

  async create(principal: AuthPrincipal, dto: SaveAutomationDto) {
    await this.validate(principal, dto);
    const now = new Date();
    const automation = new AutomationEntity({ _id: newId(), workspaceId: principal.workspaceId, listId: null, name: 'x', triggerType: AutomationTriggerType.TASK_CREATED, triggerStatus: null, actionType: AutomationActionType.ADD_TAG, actionValue: 'x', active: true, createdBy: principal.userId, createdAt: now, updatedAt: now });
    guardDomain(() => automation.rewrite(dto.listId ?? null, dto.name, dto.triggerType, dto.triggerStatus ?? null, dto.actionType, dto.actionValue, dto.active ?? true));
    const saved = await this.automations.create(automation);
    await this.audit.record(principal, 'automation.created', 'automation', saved.getId(), {});
    return AutomationsUseCase.view(saved);
  }

  async update(principal: AuthPrincipal, id: string, dto: SaveAutomationDto) {
    const automation = await this.find(principal, id);
    await this.validate(principal, dto);
    guardDomain(() => automation.rewrite(dto.listId ?? null, dto.name, dto.triggerType, dto.triggerStatus ?? null, dto.actionType, dto.actionValue, dto.active ?? automation.getActive()));
    return AutomationsUseCase.view(await this.automations.update(automation));
  }

  async remove(principal: AuthPrincipal, id: string) {
    await this.find(principal, id);
    await this.automations.delete(id);
    await this.audit.record(principal, 'automation.deleted', 'automation', id, {});
  }

  private async validate(principal: AuthPrincipal, dto: SaveAutomationDto): Promise<void> {
    if (dto.listId && !(await this.lists.findByIdInWorkspace(dto.listId, principal.workspaceId))) throw new NotFoundException('List not found');
    if (dto.actionType === AutomationActionType.ASSIGN && !(await this.members.allActive(principal.workspaceId, [dto.actionValue]))) throw new NotFoundException('User not found');
  }

  private async find(principal: AuthPrincipal, id: string): Promise<AutomationEntity> {
    const automation = await this.automations.findByIdInWorkspace(id, principal.workspaceId);
    if (!automation) throw new NotFoundException('Automation not found');
    return automation;
  }

  private static view(a: AutomationEntity) {
    return { id: a.getId(), listId: a.getListId(), name: a.getName(), triggerType: a.getTriggerType(), triggerStatus: a.getTriggerStatus(), actionType: a.getActionType(), actionValue: a.getActionValue(), active: a.getActive() };
  }
}
