import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { COMMENT_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { CommentRepository } from '@domain/repositories/comment.repository';
import { CommentAccessPolicy } from '@domain/policies/comment-access.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { CommentWriterService } from '@application/services/comment-writer.service';

@Injectable()
export class EditCommentUseCase {
  constructor(
    @Inject(COMMENT_INJECT_TOKEN) private readonly comments: CommentRepository,
    private readonly writer: CommentWriterService,
  ) {}

  async execute(principal: AuthPrincipal, commentId: string, bodyMd: string, mentionIds: string[] | undefined) {
    const comment = await this.comments.findByIdInWorkspace(commentId, principal.workspaceId);
    if (!comment) throw new NotFoundException('Comment not found');
    if (!CommentAccessPolicy.canEdit(principal, comment.getAuthorId())) throw new ForbiddenException('Only the author can edit a comment');
    return this.writer.edit(principal, comment, bodyMd, mentionIds ?? comment.getMentionIds());
  }
}
