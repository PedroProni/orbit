import { NotificationEntity } from '@domain/entities/notification.entity';

export class NotificationPresenter {
  static toView(n: NotificationEntity) {
    return { id: n.getId(), type: n.getType(), taskId: n.getTaskId(), commentId: n.getCommentId(), actorId: n.getActorId(), readAt: n.getReadAt(), createdAt: n.getCreatedAt() };
  }
}
