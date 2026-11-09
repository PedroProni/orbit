import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { COMMENT_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { CommentRepository } from '@domain/repositories/comment.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { CommentWriterService } from '@application/services/comment-writer.service';
import { EditCommentUseCase } from '@application/use-cases/comment/edit-comment.use-case';
import { DeleteCommentUseCase } from '@application/use-cases/comment/delete-comment.use-case';
import { ClickupCommentAssembler } from '@application/services/compat/clickup-comment-assembler.service';

@Injectable()
export class ClickupCommentsUseCase {
  constructor(
    @Inject(COMMENT_INJECT_TOKEN) private readonly comments: CommentRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly writer: CommentWriterService,
    private readonly editComment: EditCommentUseCase,
    private readonly deleteComment: DeleteCommentUseCase,
    private readonly assembler: ClickupCommentAssembler,
  ) {}

  async list(principal: AuthPrincipal, taskId: string) {
    if (!(await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId))) throw new NotFoundException('Task not found');
    const items = await this.comments.findMany({ workspace_id: principal.workspaceId, task_id: taskId }, { created_at: -1 });
    return { comments: await this.assembler.assemble(principal.workspaceId, items) };
  }

  async create(principal: AuthPrincipal, taskId: string, body: Record<string, any>) {
    const text = this.text(body);
    const created = await this.writer.create(principal, taskId, text, []);
    return { id: created.id, hist_id: created.id, date: String(new Date(created.createdAt).getTime()) };
  }

  async edit(principal: AuthPrincipal, commentId: string, body: Record<string, any>) {
    await this.editComment.execute(principal, commentId, this.text(body), undefined);
    return {};
  }

  async remove(principal: AuthPrincipal, commentId: string) {
    await this.deleteComment.execute(principal, commentId);
    return {};
  }

  private text(body: Record<string, any>): string {
    const text = body.comment_text ?? (Array.isArray(body.comment) ? body.comment.map((p: any) => p?.text ?? '').join('') : undefined);
    if (typeof text !== 'string' || !text.trim()) throw new BadRequestException('comment_text is required');
    return text;
  }
}
