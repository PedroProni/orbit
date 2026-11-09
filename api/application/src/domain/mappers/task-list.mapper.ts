import { TaskListEntity } from '@domain/entities/task-list.entity';

export class DomainTaskListMapper {
  static toPersistence(entity: TaskListEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      space_id: entity.getSpaceId(),
      folder_id: entity.getFolderId(),
      name: entity.getName(),
      kind: entity.getKind(),
      start_date: entity.getStartDate(),
      end_date: entity.getEndDate(),
      order: entity.getOrder(),
      clickup_id: entity.getClickupId(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): TaskListEntity {
    return new TaskListEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      spaceId: raw.space_id,
      folderId: raw.folder_id ?? null,
      name: raw.name,
      kind: raw.kind,
      startDate: raw.start_date ?? null,
      endDate: raw.end_date ?? null,
      order: raw.order,
      clickupId: raw.clickup_id ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
