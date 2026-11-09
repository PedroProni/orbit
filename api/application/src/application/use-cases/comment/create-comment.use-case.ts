import { Injectable } from '@nestjs/common';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { CommentWriterService } from '@application/services/comment-writer.service';

@Injectable()
export class CreateCommentUseCase {
  constructor(private readonly writer: CommentWriterService) {}

  execute(principal: AuthPrincipal, taskId: string, bodyMd: string, mentionIds: string[]) {
    return this.writer.create(principal, taskId, bodyMd, mentionIds);
  }
}
