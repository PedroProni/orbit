import { TaskEntity } from '@domain/entities/task.entity';

export class DomainTaskMapper {
  static toPersistence(entity: TaskEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      space_id: entity.getSpaceId(),
      list_id: entity.getListId(),
      parent_id: entity.getParentId(),
      title: entity.getTitle(),
      description_md: entity.getDescriptionMd(),
      status: entity.getStatus(),
      priority: entity.getPriority(),
      tags: entity.getTags(),
      assignee_ids: entity.getAssigneeIds(),
      watcher_ids: entity.getWatcherIds(),
      points: entity.getPoints(),
      start_date: entity.getStartDate(),
      due_date: entity.getDueDate(),
      custom_fields: entity.getCustomFields(),
      links: entity.getLinks(),
      checklists: entity.getChecklists(),
      creator_id: entity.getCreatorId(),
      date_closed: entity.getDateClosed(),
      archived: entity.getArchived(),
      clickup_id: entity.getClickupId(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): TaskEntity {
    return new TaskEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      spaceId: raw.space_id,
      listId: raw.list_id,
      parentId: raw.parent_id ?? null,
      title: raw.title,
      descriptionMd: raw.description_md,
      status: raw.status,
      priority: raw.priority ?? null,
      tags: raw.tags ?? [],
      assigneeIds: raw.assignee_ids ?? [],
      watcherIds: raw.watcher_ids ?? [],
      points: raw.points ?? null,
      startDate: raw.start_date ?? null,
      dueDate: raw.due_date ?? null,
      customFields: raw.custom_fields ?? [],
      links: raw.links,
      checklists: raw.checklists ?? [],
      creatorId: raw.creator_id,
      dateClosed: raw.date_closed ?? null,
      archived: raw.archived,
      clickupId: raw.clickup_id ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
