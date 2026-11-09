import { CreateTaskCommand } from '@application/commands/task/create-task.command';
import { UpdateTaskCommand } from '@application/commands/task/update-task.command';
import { ListTasksQuery } from '@application/commands/task/list-tasks.query';
import { CreateTaskDto } from '@shared/dtos/task/create-task.dto';
import { UpdateTaskDto } from '@shared/dtos/task/update-task.dto';
import { ListTasksQueryDto } from '@shared/dtos/task/list-tasks-query.dto';
import { toDateOrNull } from '@common/helpers/functions/date.helper';

export class ApplicationTaskMapper {
  static toCreateCommand(listId: string, dto: CreateTaskDto): CreateTaskCommand {
    return {
      listId,
      parentId: dto.parentId ?? null,
      title: dto.title,
      descriptionMd: dto.descriptionMd ?? '',
      status: dto.status ?? null,
      priority: dto.priority ?? null,
      tags: dto.tags ?? [],
      assigneeIds: dto.assigneeIds ?? [],
      watcherIds: dto.watcherIds ?? [],
      points: dto.points ?? null,
      startDate: toDateOrNull(dto.startDate),
      dueDate: toDateOrNull(dto.dueDate),
      customFields: (dto.customFields ?? []).map(c => ({ fieldId: c.fieldId, value: c.value })),
      taskKind: dto.taskKind ?? null,
    };
  }

  static toUpdateCommand(dto: UpdateTaskDto): UpdateTaskCommand {
    const { startDate, dueDate, customFields, checklists, ...rest } = dto;
    return {
      ...rest,
      startDate: startDate === undefined ? undefined : toDateOrNull(startDate),
      dueDate: dueDate === undefined ? undefined : toDateOrNull(dueDate),
      customFields: customFields?.map(c => ({ fieldId: c.fieldId, value: c.value })),
      checklists: checklists?.map(c => ({
        id: c.id ?? '',
        name: c.name,
        items: (c.items ?? []).map(i => ({ id: i.id ?? '', name: i.name, resolved: !!i.resolved, assigneeId: i.assigneeId ?? null })),
      })),
    };
  }

  static toListQuery(dto: ListTasksQueryDto): ListTasksQuery {
    return {
      page: dto.page ?? 1,
      limit: dto.limit ?? 50,
      listId: dto.listId,
      spaceId: dto.spaceId,
      parentId: dto.parentId,
      topLevel: dto.topLevel ?? false,
      statuses: dto.statuses,
      assigneeIds: dto.assigneeIds,
      unassigned: dto.unassigned ?? false,
      tags: dto.tags,
      search: dto.q?.trim() || undefined,
      includeClosed: dto.includeClosed ?? false,
      includeArchived: dto.includeArchived ?? false,
      updatedAfter: dto.updatedAfter ? new Date(dto.updatedAfter) : undefined,
      updatedBefore: dto.updatedBefore ? new Date(dto.updatedBefore) : undefined,
      createdAfter: dto.createdAfter ? new Date(dto.createdAfter) : undefined,
      dueAfter: dto.dueAfter ? new Date(dto.dueAfter) : undefined,
      dueBefore: dto.dueBefore ? new Date(dto.dueBefore) : undefined,
      orderBy: dto.orderBy ?? 'updated_at',
      reverse: dto.reverse ?? false,
    };
  }
}
