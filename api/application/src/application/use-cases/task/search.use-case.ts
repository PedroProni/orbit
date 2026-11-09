import { Inject, Injectable } from '@nestjs/common';
import { COMMENT_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { CommentRepository } from '@domain/repositories/comment.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { escapeRegex } from '@common/helpers/functions/regex.helper';
import { TaskPresenter } from '@application/presenters/task.presenter';

@Injectable()
export class SearchUseCase {
  constructor(
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    @Inject(COMMENT_INJECT_TOKEN) private readonly comments: CommentRepository,
  ) {}

  async execute(principal: AuthPrincipal, q: string, limit: number) {
    const regex = new RegExp(escapeRegex(q.trim()), 'i');
    const commentHits = await this.comments.findMany({ workspace_id: principal.workspaceId, body_md: regex }, { updated_at: -1 }, limit);
    const taskHits = await this.tasks.findMany({ workspace_id: principal.workspaceId, $or: [{ title: regex }, { description_md: regex }, { _id: { $in: commentHits.map((c) => c.getTaskId()) } }] }, { updated_at: -1 }, limit);
    return {
      tasks: taskHits.map(TaskPresenter.toView),
      comments: commentHits.map((c) => ({ id: c.getId(), taskId: c.getTaskId(), snippet: c.getBodyMd().slice(0, 200) })),
    };
  }
}
