import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { COMMENT_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { CommentRepository } from '@domain/repositories/comment.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { CommentEntity } from '@domain/entities/comment.entity';
import { NotificationType } from '@domain/enums/notification.enums';
import { DailyLogPolicy } from '@domain/policies/daily-log.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { guardDomain } from '@common/helpers/functions/domain-guard.helper';
import { newId } from '@common/helpers/functions/id.helper';
import { AuditService } from '@application/services/audit.service';
import { NotificationService } from '@application/services/notification.service';
import { RealtimeService } from '@application/services/realtime.service';
import { WorkspaceMembersService } from '@application/services/workspace-members.service';
import { CommentPresenter } from '@application/presenters/comment.presenter';

@Injectable()
export class CommentWriterService {
  constructor(
    @Inject(COMMENT_INJECT_TOKEN) private readonly comments: CommentRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly members: WorkspaceMembersService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
    private readonly realtime: RealtimeService,
  ) {}

  async create(principal: AuthPrincipal, taskId: string, bodyMd: string, mentionIds: string[], dailyLogDate: string | null = null, attachmentIds: string[] = []) {
    const task = await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId);
    if (!task) throw new NotFoundException('Task not found');
    await this.assertMentions(principal.workspaceId, mentionIds);
    const now = new Date();
    const comment = new CommentEntity({ _id: newId(), workspaceId: principal.workspaceId, taskId, authorId: principal.userId, bodyMd: bodyMd.trim(), mentionIds: [...new Set(mentionIds)], attachmentIds, dailyLogDate, editedAt: null, clickupId: null, createdAt: now, updatedAt: now });
    if (!comment.getBodyMd()) throw new BadRequestException('Comment body is required');
    const saved = await this.comments.create(comment);
    await this.audit.record(principal, 'comment.created', 'comment', saved.getId(), { taskId });
    await this.notifications.notify(principal.workspaceId, saved.getMentionIds(), NotificationType.MENTION, taskId, principal.userId, saved.getId());
    this.realtime.publish({ workspaceId: principal.workspaceId, type: 'comment.created', taskId, listId: task.getListId(), actorId: principal.userId });
    return CommentPresenter.toView(saved);
  }

  async edit(principal: AuthPrincipal, comment: CommentEntity, bodyMd: string, mentionIds: string[]) {
    await this.assertMentions(principal.workspaceId, mentionIds);
    const previous = comment.getMentionIds();
    guardDomain(() => comment.edit(bodyMd, mentionIds));
    const saved = await this.comments.patch(comment, ['bodyMd', 'mentionIds', 'editedAt']);
    await this.audit.record(principal, 'comment.updated', 'comment', saved.getId(), { taskId: saved.getTaskId() });
    await this.notifications.notify(principal.workspaceId, saved.getMentionIds().filter((id) => !previous.includes(id)), NotificationType.MENTION, saved.getTaskId(), principal.userId, saved.getId());
    this.realtime.publish({ workspaceId: principal.workspaceId, type: 'comment.updated', taskId: saved.getTaskId(), listId: null, actorId: principal.userId });
    return CommentPresenter.toView(saved);
  }

  async upsertDailyLog(principal: AuthPrincipal, taskId: string, bodyMd: string, at: Date = new Date()) {
    const dateKey = DailyLogPolicy.dateKey(at);
    const existing = await this.comments.findOne({ workspace_id: principal.workspaceId, task_id: taskId, author_id: principal.userId, daily_log_date: dateKey });
    if (existing) return this.edit(principal, existing, bodyMd, existing.getMentionIds());
    return this.create(principal, taskId, bodyMd, [], dateKey);
  }

  private async assertMentions(workspaceId: string, mentionIds: string[]): Promise<void> {
    if (!(await this.members.allActive(workspaceId, mentionIds))) throw new BadRequestException('Unknown user in mentions');
  }
}
