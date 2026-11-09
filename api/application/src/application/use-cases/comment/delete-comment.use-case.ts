import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { COMMENT_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { CommentRepository } from '@domain/repositories/comment.repository';
import { CommentAccessPolicy } from '@domain/policies/comment-access.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';
import { RealtimeService } from '@application/services/realtime.service';

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    @Inject(COMMENT_INJECT_TOKEN) private readonly comments: CommentRepository,
    private readonly audit: AuditService,
    private readonly realtime: RealtimeService,
  ) {}

  async execute(principal: AuthPrincipal, commentId: string): Promise<void> {
    const comment = await this.comments.findByIdInWorkspace(commentId, principal.workspaceId);
    if (!comment) throw new NotFoundException('Comment not found');
    if (!CommentAccessPolicy.canDelete(principal, comment.getAuthorId())) throw new ForbiddenException('Not allowed to delete this comment');
    await this.comments.delete(commentId);
    await this.audit.record(principal, 'comment.deleted', 'comment', commentId, { taskId: comment.getTaskId() });
    this.realtime.publish({ workspaceId: principal.workspaceId, type: 'comment.deleted', taskId: comment.getTaskId(), listId: null, actorId: principal.userId });
  }
}
