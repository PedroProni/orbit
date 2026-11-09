import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { NotificationRepository } from '@domain/repositories/notification.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { NotificationPresenter } from '@application/presenters/notification.presenter';

@Injectable()
export class ListNotificationsUseCase {
  constructor(@Inject(NOTIFICATION_INJECT_TOKEN) private readonly notifications: NotificationRepository) {}

  async execute(principal: AuthPrincipal, unreadOnly: boolean) {
    const filter: Record<string, unknown> = { workspace_id: principal.workspaceId, user_id: principal.userId };
    if (unreadOnly) filter.read_at = null;
    const items = await this.notifications.findMany(filter, { created_at: -1 }, 100);
    const unread = await this.notifications.count({ workspace_id: principal.workspaceId, user_id: principal.userId, read_at: null });
    return { unread, data: items.map(NotificationPresenter.toView) };
  }
}
