import { TimeEntryEntity } from '@domain/entities/time-entry.entity';

export class DomainTimeEntryMapper {
  static toPersistence(entity: TimeEntryEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      task_id: entity.getTaskId(),
      user_id: entity.getUserId(),
      started_at: entity.getStartedAt(),
      ended_at: entity.getEndedAt(),
      minutes: entity.getMinutes(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): TimeEntryEntity {
    return new TimeEntryEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      taskId: raw.task_id,
      userId: raw.user_id,
      startedAt: raw.started_at,
      endedAt: raw.ended_at ?? null,
      minutes: raw.minutes,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
