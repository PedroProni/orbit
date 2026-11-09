import { AttachmentEntity } from '@domain/entities/attachment.entity';

export class AttachmentPresenter {
  static toView(a: AttachmentEntity) {
    return { id: a.getId(), taskId: a.getTaskId(), commentId: a.getCommentId(), filename: a.getFilename(), mimeType: a.getMimeType(), sizeBytes: a.getSizeBytes(), uploaderId: a.getUploaderId(), confirmed: a.getConfirmed(), createdAt: a.getCreatedAt() };
  }
}
