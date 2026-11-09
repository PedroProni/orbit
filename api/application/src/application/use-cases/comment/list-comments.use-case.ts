import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { COMMENT_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { CommentRepository } from '@domain/repositories/comment.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { CommentPresenter } from '@application/presenters/comment.presenter';

@Injectable()
export class ListCommentsUseCase {
  constructor(
    @Inject(COMMENT_INJECT_TOKEN) private readonly comments: CommentRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
  ) {}

  async execute(principal: AuthPrincipal, taskId: string) {
    const task = await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId);
    if (!task) throw new NotFoundException('Task not found');
    const items = await this.comments.findMany({ workspace_id: principal.workspaceId, task_id: taskId }, { created_at: 1 });
    return items.map(CommentPresenter.toView);
  }
}
