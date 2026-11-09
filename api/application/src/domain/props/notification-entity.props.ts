import { NotificationType } from '@domain/enums/notification.enums';

export interface NotificationEntityProps {
  _id: string;
  workspaceId: string;
  userId: string;
  type: NotificationType;
  taskId: string;
  commentId: string | null;
  actorId: string;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
