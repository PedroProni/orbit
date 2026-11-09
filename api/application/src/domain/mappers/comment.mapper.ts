import { CommentEntity } from '@domain/entities/comment.entity';

export class DomainCommentMapper {
  static toPersistence(entity: CommentEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      task_id: entity.getTaskId(),
      author_id: entity.getAuthorId(),
      body_md: entity.getBodyMd(),
      mention_ids: entity.getMentionIds(),
      attachment_ids: entity.getAttachmentIds(),
      daily_log_date: entity.getDailyLogDate(),
      edited_at: entity.getEditedAt(),
      clickup_id: entity.getClickupId(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): CommentEntity {
    return new CommentEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      taskId: raw.task_id,
      authorId: raw.author_id,
      bodyMd: raw.body_md,
      mentionIds: raw.mention_ids ?? [],
      attachmentIds: raw.attachment_ids ?? [],
      dailyLogDate: raw.daily_log_date ?? null,
      editedAt: raw.edited_at ?? null,
      clickupId: raw.clickup_id ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
