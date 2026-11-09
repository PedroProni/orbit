import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UploadedFile, UseFilters, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiExcludeController } from '@nestjs/swagger';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_ATTACHMENTS_WRITE, SCOPE_COMMENTS_WRITE, SCOPE_TASKS_READ, SCOPE_TASKS_WRITE, SCOPE_WORKSPACE_READ } from '@domain/constants/scopes.constant';
import { DeleteTaskUseCase } from '@application/use-cases/task/delete-task.use-case';
import { ClickupListTasksUseCase } from '@application/use-cases/compat/clickup-list-tasks.use-case';
import { ClickupWriteTaskUseCase } from '@application/use-cases/compat/clickup-write-task.use-case';
import { ClickupCommentsUseCase } from '@application/use-cases/compat/clickup-comments.use-case';
import { ClickupHierarchyUseCase } from '@application/use-cases/compat/clickup-hierarchy.use-case';
import { ClickupAttachmentUseCase } from '@application/use-cases/compat/clickup-attachment.use-case';
import { ClickupErrorFilter } from '@presentation/filters/clickup-error.filter';

@ApiExcludeController()
@UseFilters(ClickupErrorFilter)
@Controller('api/v2')
export class ClickupCompatController {
  constructor(
    private readonly listTasks: ClickupListTasksUseCase,
    private readonly writeTask: ClickupWriteTaskUseCase,
    private readonly comments: ClickupCommentsUseCase,
    private readonly hierarchy: ClickupHierarchyUseCase,
    private readonly attachment: ClickupAttachmentUseCase,
    private readonly deleteTask: DeleteTaskUseCase,
  ) {}

  @Get('team')
  @Authenticated(SCOPE_WORKSPACE_READ)
  teams(@CurrentPrincipal() p: AuthPrincipal) {
    return this.hierarchy.teams(p);
  }

  @Get('team/:teamId/task')
  @Authenticated(SCOPE_TASKS_READ)
  teamTasks(@CurrentPrincipal() p: AuthPrincipal, @Query() q: Record<string, any>) {
    return this.listTasks.execute(p, q);
  }

  @Get('team/:teamId/space')
  @Authenticated(SCOPE_WORKSPACE_READ)
  spaces(@CurrentPrincipal() p: AuthPrincipal) {
    return this.hierarchy.spacesOf(p);
  }

  @Get('space/:spaceId/folder')
  @Authenticated(SCOPE_WORKSPACE_READ)
  folders(@CurrentPrincipal() p: AuthPrincipal, @Param('spaceId') spaceId: string) {
    return this.hierarchy.foldersOf(p, spaceId);
  }

  @Get('space/:spaceId/list')
  @Authenticated(SCOPE_WORKSPACE_READ)
  spaceLists(@CurrentPrincipal() p: AuthPrincipal, @Param('spaceId') spaceId: string) {
    return this.hierarchy.listsOf(p, { spaceId });
  }

  @Get('folder/:folderId/list')
  @Authenticated(SCOPE_WORKSPACE_READ)
  folderLists(@CurrentPrincipal() p: AuthPrincipal, @Param('folderId') folderId: string) {
    return this.hierarchy.listsOf(p, { folderId });
  }

  @Get('list/:listId')
  @Authenticated(SCOPE_WORKSPACE_READ)
  list(@CurrentPrincipal() p: AuthPrincipal, @Param('listId') listId: string) {
    return this.hierarchy.list(p, listId);
  }

  @Get('list/:listId/task')
  @Authenticated(SCOPE_TASKS_READ)
  listTasksOf(@CurrentPrincipal() p: AuthPrincipal, @Param('listId') listId: string, @Query() q: Record<string, any>) {
    return this.listTasks.execute(p, q, { listId });
  }

  @Post('list/:listId/task')
  @HttpCode(200)
  @Authenticated(SCOPE_TASKS_WRITE)
  createTask(@CurrentPrincipal() p: AuthPrincipal, @Param('listId') listId: string, @Body() body: Record<string, any>) {
    return this.writeTask.create(p, listId, body);
  }

  @Get('task/:taskId')
  @Authenticated(SCOPE_TASKS_READ)
  getTask(@CurrentPrincipal() p: AuthPrincipal, @Param('taskId') taskId: string, @Query('include_subtasks') includeSubtasks?: string) {
    return this.writeTask.fetch(p, taskId, includeSubtasks === 'true');
  }

  @Put('task/:taskId')
  @Authenticated(SCOPE_TASKS_WRITE)
  updateTask(@CurrentPrincipal() p: AuthPrincipal, @Param('taskId') taskId: string, @Body() body: Record<string, any>) {
    return this.writeTask.update(p, taskId, body);
  }

  @Delete('task/:taskId')
  @HttpCode(204)
  @Authenticated(SCOPE_TASKS_WRITE)
  async removeTask(@CurrentPrincipal() p: AuthPrincipal, @Param('taskId') taskId: string) {
    await this.deleteTask.execute(p, taskId);
  }

  @Get('task/:taskId/comment')
  @Authenticated(SCOPE_TASKS_READ)
  taskComments(@CurrentPrincipal() p: AuthPrincipal, @Param('taskId') taskId: string) {
    return this.comments.list(p, taskId);
  }

  @Post('task/:taskId/comment')
  @HttpCode(200)
  @Authenticated(SCOPE_COMMENTS_WRITE)
  addComment(@CurrentPrincipal() p: AuthPrincipal, @Param('taskId') taskId: string, @Body() body: Record<string, any>) {
    return this.comments.create(p, taskId, body);
  }

  @Put('comment/:commentId')
  @Authenticated(SCOPE_COMMENTS_WRITE)
  editComment(@CurrentPrincipal() p: AuthPrincipal, @Param('commentId') commentId: string, @Body() body: Record<string, any>) {
    return this.comments.edit(p, commentId, body);
  }

  @Delete('comment/:commentId')
  @Authenticated(SCOPE_COMMENTS_WRITE)
  removeComment(@CurrentPrincipal() p: AuthPrincipal, @Param('commentId') commentId: string) {
    return this.comments.remove(p, commentId);
  }

  @Post('task/:taskId/attachment')
  @HttpCode(200)
  @Authenticated(SCOPE_ATTACHMENTS_WRITE)
  @UseInterceptors(FileInterceptor('attachment', { limits: { fileSize: 52428800 } }))
  addAttachment(@CurrentPrincipal() p: AuthPrincipal, @Param('taskId') taskId: string, @UploadedFile() file?: { originalname: string; mimetype: string; buffer: Buffer }) {
    return this.attachment.execute(p, taskId, file);
  }
}
