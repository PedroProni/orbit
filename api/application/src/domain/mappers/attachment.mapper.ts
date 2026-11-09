import { AttachmentEntity } from '@domain/entities/attachment.entity';

export class DomainAttachmentMapper {
  static toPersistence(entity: AttachmentEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      task_id: entity.getTaskId(),
      comment_id: entity.getCommentId(),
      storage_key: entity.getStorageKey(),
      filename: entity.getFilename(),
      mime_type: entity.getMimeType(),
      size_bytes: entity.getSizeBytes(),
      uploader_id: entity.getUploaderId(),
      confirmed: entity.getConfirmed(),
      gallery: entity.getGallery(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): AttachmentEntity {
    return new AttachmentEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      taskId: raw.task_id,
      commentId: raw.comment_id ?? null,
      storageKey: raw.storage_key,
      filename: raw.filename,
      mimeType: raw.mime_type,
      sizeBytes: raw.size_bytes,
      uploaderId: raw.uploader_id,
      confirmed: raw.confirmed,
      gallery: raw.gallery ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
