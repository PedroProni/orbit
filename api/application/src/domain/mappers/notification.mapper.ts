import { NotificationEntity } from '@domain/entities/notification.entity';

export class DomainNotificationMapper {
  static toPersistence(entity: NotificationEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      user_id: entity.getUserId(),
      type: entity.getType(),
      task_id: entity.getTaskId(),
      comment_id: entity.getCommentId(),
      actor_id: entity.getActorId(),
      read_at: entity.getReadAt(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): NotificationEntity {
    return new NotificationEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      userId: raw.user_id,
      type: raw.type,
      taskId: raw.task_id,
      commentId: raw.comment_id ?? null,
      actorId: raw.actor_id,
      readAt: raw.read_at ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
