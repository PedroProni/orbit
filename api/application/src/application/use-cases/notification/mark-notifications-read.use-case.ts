import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { NotificationRepository } from '@domain/repositories/notification.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

@Injectable()
export class MarkNotificationsReadUseCase {
  constructor(@Inject(NOTIFICATION_INJECT_TOKEN) private readonly notifications: NotificationRepository) {}

  async execute(principal: AuthPrincipal, ids: string[] | null): Promise<void> {
    const targets = await this.notifications.findMany({ workspace_id: principal.workspaceId, user_id: principal.userId, read_at: null, ...(ids ? { _id: { $in: ids } } : {}) }, { created_at: -1 }, 500);
    for (const target of targets) {
      target.markRead();
      await this.notifications.patch(target, ['readAt']);
    }
  }
}
