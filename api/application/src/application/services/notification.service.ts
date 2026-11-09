import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { NotificationRepository } from '@domain/repositories/notification.repository';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification.enums';
import { newId } from '@common/helpers/functions/id.helper';

@Injectable()
export class NotificationService {
  constructor(@Inject(NOTIFICATION_INJECT_TOKEN) private readonly notifications: NotificationRepository) {}

  async notify(workspaceId: string, userIds: string[], type: NotificationType, taskId: string, actorId: string, commentId: string | null = null): Promise<void> {
    const targets = [...new Set(userIds)].filter((id) => id !== actorId);
    const now = new Date();
    await Promise.all(targets.map((userId) => this.notifications.create(new NotificationEntity({ _id: newId(), workspaceId, userId, type, taskId, commentId, actorId, readAt: null, createdAt: now, updatedAt: now }))));
  }
}
