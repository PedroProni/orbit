import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_COMMENTS_WRITE, SCOPE_TASKS_READ } from '@domain/constants/scopes.constant';
import { CreateCommentUseCase } from '@application/use-cases/comment/create-comment.use-case';
import { EditCommentUseCase } from '@application/use-cases/comment/edit-comment.use-case';
import { DeleteCommentUseCase } from '@application/use-cases/comment/delete-comment.use-case';
import { ListCommentsUseCase } from '@application/use-cases/comment/list-comments.use-case';
import { UpsertDailyLogUseCase } from '@application/use-cases/comment/upsert-daily-log.use-case';
import { CreateCommentDto } from '@shared/dtos/comment/create-comment.dto';
import { EditCommentDto } from '@shared/dtos/comment/edit-comment.dto';
import { DailyLogDto } from '@shared/dtos/comment/daily-log.dto';

@ApiTags('Comments')
@Controller()
export class CommentController {
  constructor(
    private readonly createComment: CreateCommentUseCase,
    private readonly editComment: EditCommentUseCase,
    private readonly deleteComment: DeleteCommentUseCase,
    private readonly listComments: ListCommentsUseCase,
    private readonly upsertDailyLog: UpsertDailyLogUseCase,
  ) {}

  @Get('tasks/:taskId/comments')
  @Authenticated(SCOPE_TASKS_READ)
  list(@CurrentPrincipal() principal: AuthPrincipal, @Param('taskId') taskId: string) {
    return this.listComments.execute(principal, taskId);
  }

  @Post('tasks/:taskId/comments')
  @Authenticated(SCOPE_COMMENTS_WRITE)
  create(@CurrentPrincipal() principal: AuthPrincipal, @Param('taskId') taskId: string, @Body() dto: CreateCommentDto) {
    return this.createComment.execute(principal, taskId, dto.bodyMd, dto.mentionIds ?? []);
  }

  @Put('tasks/:taskId/daily-log')
  @Authenticated(SCOPE_COMMENTS_WRITE)
  dailyLog(@CurrentPrincipal() principal: AuthPrincipal, @Param('taskId') taskId: string, @Body() dto: DailyLogDto) {
    return this.upsertDailyLog.execute(principal, taskId, dto.bodyMd);
  }

  @Patch('comments/:id')
  @Authenticated(SCOPE_COMMENTS_WRITE)
  edit(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: EditCommentDto) {
    return this.editComment.execute(principal, id, dto.bodyMd, dto.mentionIds);
  }

  @Delete('comments/:id')
  @HttpCode(204)
  @Authenticated(SCOPE_COMMENTS_WRITE)
  async remove(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.deleteComment.execute(principal, id);
  }
}
