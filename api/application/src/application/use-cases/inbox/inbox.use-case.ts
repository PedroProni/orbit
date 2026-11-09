import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { NotificationRepository } from '@domain/repositories/notification.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { DUE_SOON_DAYS } from '@domain/constants/inbox.constant';
import { CalendarDayPolicy } from '@domain/policies/calendar-day.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { TaskPresenter } from '@application/presenters/task.presenter';

@Injectable()
export class InboxUseCase {
  constructor(
    @Inject(NOTIFICATION_INJECT_TOKEN) private readonly notifications: NotificationRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
  ) {}

  async get(principal: AuthPrincipal) {
    const [unread, assigned] = await Promise.all([
      this.notifications.count({ workspace_id: principal.workspaceId, user_id: principal.userId, read_at: null }),
      this.tasks.findMany({ workspace_id: principal.workspaceId, assignee_ids: principal.userId, date_closed: null, archived: false }, { due_date: 1 }, 200),
    ]);
    const now = Date.now();
    const overdue = assigned.filter((t) => CalendarDayPolicy.isOverdue(t.getDueDate(), now));
    const soon = assigned.filter((t) => CalendarDayPolicy.isDueWithin(t.getDueDate(), now, DUE_SOON_DAYS));
    return { unreadNotifications: unread, overdue: overdue.map(TaskPresenter.toView), dueSoon: soon.map(TaskPresenter.toView), assignedOpen: assigned.length };
  }
}
