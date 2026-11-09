import { CommentEntity } from '@domain/entities/comment.entity';

export class CommentPresenter {
  static toView(comment: CommentEntity) {
    return {
      id: comment.getId(),
      taskId: comment.getTaskId(),
      authorId: comment.getAuthorId(),
      bodyMd: comment.getBodyMd(),
      mentionIds: comment.getMentionIds(),
      attachmentIds: comment.getAttachmentIds(),
      dailyLogDate: comment.getDailyLogDate(),
      editedAt: comment.getEditedAt(),
      createdAt: comment.getCreatedAt(),
      updatedAt: comment.getUpdatedAt(),
    };
  }
}
