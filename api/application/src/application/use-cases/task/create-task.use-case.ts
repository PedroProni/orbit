import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SPACE_INJECT_TOKEN, TASK_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN, CUSTOM_FIELD_DEFINITION_INJECT_TOKEN, TASK_PLAN_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { TaskPlanRepository } from '@domain/repositories/task-plan.repository';
import { TaskPlanEntity } from '@domain/entities/task-plan.entity';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { CustomFieldDefinitionRepository } from '@domain/repositories/custom-field-definition.repository';
import { TaskEntity } from '@domain/entities/task.entity';
import { NotificationType } from '@domain/enums/notification.enums';
import { TaskCreationPolicy } from '@domain/policies/task-creation.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId, newShortId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { NotificationService } from '@application/services/notification.service';
import { RealtimeService } from '@application/services/realtime.service';
import { WorkspaceMembersService } from '@application/services/workspace-members.service';
import { CustomFieldValidationService } from '@application/services/custom-field-validation.service';
import { CreateTaskCommand } from '@application/commands/task/create-task.command';
import { TaskPresenter } from '@application/presenters/task.presenter';
import { StatusAliasPolicy } from '@domain/policies/status-alias.policy';
import { CANCELLED_TAG } from '@domain/constants/status-aliases.constant';

@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    @Inject(CUSTOM_FIELD_DEFINITION_INJECT_TOKEN) private readonly fields: CustomFieldDefinitionRepository,
    @Inject(TASK_PLAN_INJECT_TOKEN) private readonly plans: TaskPlanRepository,
    private readonly members: WorkspaceMembersService,
    private readonly customFieldValidation: CustomFieldValidationService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(principal: AuthPrincipal, command: CreateTaskCommand) {
    const parent = command.parentId ? await this.tasks.findByIdInWorkspace(command.parentId, principal.workspaceId) : null;
    if (command.parentId && !parent) throw new NotFoundException('Parent task not found');
    if (parent?.getParentId()) throw new BadRequestException('Subtasks cannot have subtasks');
    const list = await this.lists.findByIdInWorkspace(parent ? parent.getListId() : command.listId, principal.workspaceId);
    if (!list) throw new NotFoundException('List not found');
    const space = await this.spaces.findByIdInWorkspace(list.getSpaceId(), principal.workspaceId);
    if (!space) throw new NotFoundException('Space not found');
    const requestedStatus = command.status ?? space.firstOpenStatus();
    const status = space.resolveStatus(requestedStatus);
    if (!status) throw new BadRequestException('Unknown status for this space');
    const cancelled = status !== requestedStatus && StatusAliasPolicy.isCancelled(requestedStatus);
    const tags = [...new Set([...command.tags, ...(cancelled ? [CANCELLED_TAG] : [])].map((t) => t.trim().toLowerCase()).filter(Boolean))];
    if (!parent) {
      if (!TaskCreationPolicy.hasAllowedPrefix(command.title, space.getTitlePrefixes())) throw new BadRequestException(`Title must start with one of: ${space.getTitlePrefixes().map((p) => `[${p}]`).join(', ')}`);
      if (!TaskCreationPolicy.hasRequiredTag(tags, space.getRequiredTags())) throw new BadRequestException(`At least one tag is required: ${space.getRequiredTags().join(', ')}`);
    }
    const people = [...command.assigneeIds, ...command.watcherIds];
    if (!(await this.members.allActive(principal.workspaceId, people))) throw new BadRequestException('Unknown user in assignees or watchers');
    await this.customFieldValidation.validate(this.fields, principal.workspaceId, space.getId(), command.customFields);
    const now = new Date();
    const task = new TaskEntity({
      _id: newShortId(),
      workspaceId: principal.workspaceId,
      spaceId: space.getId(),
      listId: list.getId(),
      parentId: parent ? parent.getId() : null,
      title: command.title.trim(),
      descriptionMd: command.descriptionMd,
      status,
      priority: command.priority,
      tags,
      assigneeIds: [...new Set(command.assigneeIds)],
      watcherIds: [...new Set([...command.watcherIds, principal.userId])],
      points: command.points,
      startDate: null,
      dueDate: null,
      customFields: command.customFields,
      checklists: [],
      creatorId: principal.userId,
      dateClosed: space.isClosedStatus(status) ? now : null,
      archived: false,
      clickupId: null,
      createdAt: now,
      updatedAt: now,
    });
    guardDomain(() => {
      task.changeTitle(command.title);
      task.changeDates(command.startDate, command.dueDate);
      task.changePoints(command.points);
    });
    const saved = await this.tasks.create(task);
    if (command.taskKind) await this.plans.create(new TaskPlanEntity({ _id: newId(), workspaceId: principal.workspaceId, taskId: saved.getId(), estimateMinutes: null, taskKind: command.taskKind, createdAt: now, updatedAt: now }));
    await this.audit.record(principal, 'task.created', 'task', saved.getId(), { title: saved.getTitle(), listId: saved.getListId(), ...(command.taskKind ? { taskKind: command.taskKind } : {}) });
    await this.notifications.notify(principal.workspaceId, saved.getAssigneeIds(), NotificationType.ASSIGNMENT, saved.getId(), principal.userId);
    this.realtime.publish({ workspaceId: principal.workspaceId, type: 'task.created', taskId: saved.getId(), listId: saved.getListId(), actorId: principal.userId, status: saved.getStatus(), statusChanged: true });
    return TaskPresenter.toView(saved);
  }
}
