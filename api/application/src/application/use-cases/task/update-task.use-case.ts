import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SPACE_INJECT_TOKEN, TASK_INJECT_TOKEN, TASK_LIST_INJECT_TOKEN, CUSTOM_FIELD_DEFINITION_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { CustomFieldDefinitionRepository } from '@domain/repositories/custom-field-definition.repository';
import { NotificationType } from '@domain/enums/notification.enums';
import { TaskCreationPolicy } from '@domain/policies/task-creation.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { AuditService } from '@application/services/audit.service';
import { NotificationService } from '@application/services/notification.service';
import { RealtimeService } from '@application/services/realtime.service';
import { WorkspaceMembersService } from '@application/services/workspace-members.service';
import { CustomFieldValidationService } from '@application/services/custom-field-validation.service';
import { ChecklistNormalizer } from '@application/services/checklist-normalizer';
import { UpdateTaskCommand } from '@application/commands/task/update-task.command';
import { TaskPresenter } from '@application/presenters/task.presenter';
import { StatusAliasPolicy } from '@domain/policies/status-alias.policy';
import { CANCELLED_TAG } from '@domain/constants/status-aliases.constant';

@Injectable()
export class UpdateTaskUseCase {
  constructor(
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    @Inject(SPACE_INJECT_TOKEN) private readonly spaces: SpaceRepository,
    @Inject(CUSTOM_FIELD_DEFINITION_INJECT_TOKEN) private readonly fields: CustomFieldDefinitionRepository,
    private readonly members: WorkspaceMembersService,
    private readonly customFieldValidation: CustomFieldValidationService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string, command: UpdateTaskCommand) {
    const task = await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId);
    if (!task) throw new NotFoundException('Task not found');
    const before = task.toProps();
    let space = await this.spaces.findByIdInWorkspace(task.getSpaceId(), principal.workspaceId);
    if (!space) throw new NotFoundException('Space not found');

    if (command.listId !== undefined && command.listId !== task.getListId()) {
      if (task.getParentId()) throw new BadRequestException('Subtasks move with their parent');
      const list = await this.lists.findByIdInWorkspace(command.listId, principal.workspaceId);
      if (!list) throw new NotFoundException('List not found');
      const targetSpace = list.getSpaceId() === space.getId() ? space : await this.spaces.findByIdInWorkspace(list.getSpaceId(), principal.workspaceId);
      if (!targetSpace) throw new NotFoundException('Space not found');
      const status = targetSpace.hasStatus(task.getStatus()) ? task.getStatus() : targetSpace.firstOpenStatus();
      task.moveToList(list.getId(), targetSpace.getId(), status, targetSpace.isClosedStatus(status));
      space = targetSpace;
    }
    if (command.title !== undefined) {
      if (command.title.trim() !== before.title && !task.getParentId() && !TaskCreationPolicy.hasAllowedPrefix(command.title.trim(), space.getTitlePrefixes())) {
        throw new BadRequestException(
          `Title must start with one of: ${space
            .getTitlePrefixes()
            .map(p => `[${p}]`)
            .join(', ')}`,
        );
      }
      guardDomain(() => task.changeTitle(command.title!));
    }
    if (command.descriptionMd !== undefined) task.changeDescription(command.descriptionMd);
    if (command.status !== undefined) {
      const status = space.resolveStatus(command.status);
      if (!status) throw new BadRequestException('Unknown status for this space');
      task.changeStatus(status, space.isClosedStatus(status));
      if (status !== command.status && StatusAliasPolicy.isCancelled(command.status)) command = { ...command, addTags: [...(command.addTags ?? []), CANCELLED_TAG] };
    }
    if (command.priority !== undefined) task.changePriority(command.priority);
    const normalize = (values: string[] | undefined) => [...new Set((values ?? []).map(t => t.trim().toLowerCase()).filter(Boolean))];
    const tagOps = command.tags === undefined && (command.addTags || command.removeTags) ? { add: normalize(command.addTags), remove: normalize(command.removeTags) } : null;
    const assigneeOps =
      command.assigneeIds === undefined && (command.addAssigneeIds || command.removeAssigneeIds)
        ? { add: [...new Set(command.addAssigneeIds ?? [])], remove: [...new Set(command.removeAssigneeIds ?? [])] }
        : null;
    if (command.tags !== undefined || command.addTags || command.removeTags) {
      const base = command.tags ?? task.getTags();
      const removed = new Set((command.removeTags ?? []).map(t => t.trim().toLowerCase()));
      task.replaceTags([...base, ...(command.addTags ?? [])].filter(t => !removed.has(t.trim().toLowerCase())));
      if (!task.getParentId() && !TaskCreationPolicy.hasRequiredTag(task.getTags(), space.getRequiredTags()))
        throw new BadRequestException(`At least one tag is required: ${space.getRequiredTags().join(', ')}`);
    }
    if (command.assigneeIds !== undefined || command.addAssigneeIds || command.removeAssigneeIds) {
      const base = command.assigneeIds ?? task.getAssigneeIds();
      const removed = new Set(command.removeAssigneeIds ?? []);
      const next = [...base, ...(command.addAssigneeIds ?? [])].filter(id => !removed.has(id));
      if (!(await this.members.allActive(principal.workspaceId, next))) throw new BadRequestException('Unknown user in assignees');
      task.replaceAssignees(next);
    }
    if (command.watcherIds !== undefined) {
      if (!(await this.members.allActive(principal.workspaceId, command.watcherIds))) throw new BadRequestException('Unknown user in watchers');
      task.replaceWatchers(command.watcherIds);
    }
    if (command.points !== undefined) guardDomain(() => task.changePoints(command.points!));
    if (command.startDate !== undefined || command.dueDate !== undefined) {
      guardDomain(() => task.changeDates(command.startDate !== undefined ? command.startDate : task.getStartDate(), command.dueDate !== undefined ? command.dueDate : task.getDueDate()));
    }
    if (command.customFields !== undefined) {
      await this.customFieldValidation.validate(this.fields, principal.workspaceId, space.getId(), command.customFields);
      task.replaceCustomFields(command.customFields);
    }
    if (command.links !== undefined) guardDomain(() => task.setLinks(command.links!));
    if (command.checklists !== undefined) task.replaceChecklists(ChecklistNormalizer.normalize(command.checklists));
    if (command.archived !== undefined) task.setArchived(command.archived);

    const after = task.toProps() as unknown as Record<string, unknown>;
    const previous = before as unknown as Record<string, unknown>;
    const changed = Object.keys(after).filter(key => key !== 'updatedAt' && JSON.stringify(after[key]) !== JSON.stringify(previous[key]));
    if (changed.length === 0) return TaskPresenter.toView(task);
    const scalarChanged = changed.filter(key => !(key === 'tags' && tagOps) && !(key === 'assigneeIds' && assigneeOps));
    let saved = scalarChanged.length > 0 ? await this.tasks.patch(task, scalarChanged) : task;
    if (tagOps || assigneeOps) {
      await this.tasks.modifySets(taskId, principal.workspaceId, { tags: tagOps ?? undefined, assigneeIds: assigneeOps ?? undefined });
      saved = (await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId)) ?? saved;
    }
    if (changed.includes('listId')) {
      const children = await this.tasks.findMany({ workspace_id: principal.workspaceId, parent_id: taskId });
      for (const child of children) {
        child.moveToList(saved.getListId(), saved.getSpaceId(), space.hasStatus(child.getStatus()) ? child.getStatus() : space.firstOpenStatus(), space.isClosedStatus(child.getStatus()));
        await this.tasks.patch(child, ['listId', 'spaceId', 'status', 'dateClosed']);
      }
    }
    const diff: Record<string, { before: unknown; after: unknown }> = {};
    for (const key of changed) if (key !== 'descriptionMd' && key !== 'checklists') diff[key] = { before: previous[key], after: after[key] };
    await this.audit.record(principal, 'task.updated', 'task', taskId, { changed, diff });
    const addedAssignees = saved.getAssigneeIds().filter(id => !before.assigneeIds.includes(id));
    await this.notifications.notify(principal.workspaceId, addedAssignees, NotificationType.ASSIGNMENT, taskId, principal.userId);
    if (changed.includes('status'))
      await this.notifications.notify(principal.workspaceId, [...saved.getAssigneeIds(), ...saved.getWatcherIds()], NotificationType.STATUS_CHANGE, taskId, principal.userId);
    this.realtime.publish({
      workspaceId: principal.workspaceId,
      type: 'task.updated',
      taskId,
      listId: saved.getListId(),
      actorId: principal.userId,
      status: saved.getStatus(),
      statusChanged: changed.includes('status'),
    });
    return TaskPresenter.toView(saved);
  }
}
