import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GuestReadable } from '@infrastructure/auth/guest-readable.decorator';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SCOPE_TASKS_READ, SCOPE_TASKS_WRITE } from '@domain/constants/scopes.constant';
import { CreateTaskUseCase } from '@application/use-cases/task/create-task.use-case';
import { UpdateTaskUseCase } from '@application/use-cases/task/update-task.use-case';
import { GetTaskUseCase } from '@application/use-cases/task/get-task.use-case';
import { TaskActivityUseCase } from '@application/use-cases/task/task-activity.use-case';
import { ListTasksUseCase } from '@application/use-cases/task/list-tasks.use-case';
import { TaskAssigneeCountsUseCase } from '@application/use-cases/task/task-assignee-counts.use-case';
import { DeleteTaskUseCase } from '@application/use-cases/task/delete-task.use-case';
import { ApplicationTaskMapper } from '@application/mappers/task.mapper';
import { CreateTaskDto } from '@shared/dtos/task/create-task.dto';
import { UpdateTaskDto } from '@shared/dtos/task/update-task.dto';
import { ListTasksQueryDto } from '@shared/dtos/task/list-tasks-query.dto';

@ApiTags('Tasks')
@Controller()
export class TaskController {
  constructor(
    private readonly createTask: CreateTaskUseCase,
    private readonly updateTask: UpdateTaskUseCase,
    private readonly getTask: GetTaskUseCase,
    private readonly listTasks: ListTasksUseCase,
    private readonly assigneeCounts: TaskAssigneeCountsUseCase,
    private readonly deleteTask: DeleteTaskUseCase,
    private readonly activity: TaskActivityUseCase,
  ) {}

  @Post('lists/:listId/tasks')
  @Authenticated(SCOPE_TASKS_WRITE)
  create(@CurrentPrincipal() principal: AuthPrincipal, @Param('listId') listId: string, @Body() dto: CreateTaskDto) {
    return this.createTask.execute(principal, ApplicationTaskMapper.toCreateCommand(listId, dto));
  }

  @Get('tasks')
  @GuestReadable()
  @Authenticated(SCOPE_TASKS_READ)
  list(@CurrentPrincipal() principal: AuthPrincipal, @Query() query: ListTasksQueryDto) {
    return this.listTasks.execute(principal, ApplicationTaskMapper.toListQuery(query));
  }

  @Get('tasks/assignee-counts')
  @Authenticated(SCOPE_TASKS_READ)
  countByAssignee(@CurrentPrincipal() principal: AuthPrincipal, @Query() query: ListTasksQueryDto) {
    return this.assigneeCounts.execute(principal, ApplicationTaskMapper.toListQuery(query));
  }

  @Get('tasks/:id')
  @GuestReadable()
  @Authenticated(SCOPE_TASKS_READ)
  get(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.getTask.execute(principal, id);
  }

  @Get('tasks/:id/activity')
  @GuestReadable()
  @Authenticated(SCOPE_TASKS_READ)
  history(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    return this.activity.execute(principal, id);
  }

  @Patch('tasks/:id')
  @Authenticated(SCOPE_TASKS_WRITE)
  update(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.updateTask.execute(principal, id, ApplicationTaskMapper.toUpdateCommand(dto));
  }

  @Delete('tasks/:id')
  @HttpCode(204)
  @Authenticated(SCOPE_TASKS_WRITE)
  async remove(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string) {
    await this.deleteTask.execute(principal, id);
  }
}
