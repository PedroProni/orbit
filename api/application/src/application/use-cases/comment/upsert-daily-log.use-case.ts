import { Injectable } from '@nestjs/common';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { CommentWriterService } from '@application/services/comment-writer.service';

@Injectable()
export class UpsertDailyLogUseCase {
  constructor(private readonly writer: CommentWriterService) {}

  execute(principal: AuthPrincipal, taskId: string, bodyMd: string) {
    return this.writer.upsertDailyLog(principal, taskId, bodyMd);
  }
}
