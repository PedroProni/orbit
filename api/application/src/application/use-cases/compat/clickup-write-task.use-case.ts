import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { CreateTaskUseCase } from '@application/use-cases/task/create-task.use-case';
import { UpdateTaskUseCase } from '@application/use-cases/task/update-task.use-case';
import { ClickupInputMapper } from '@application/mappers/compat/clickup-input.mapper';
import { ClickupTaskAssembler } from '@application/services/compat/clickup-task-assembler.service';
import { ClickupUserResolver } from '@application/services/compat/clickup-user-resolver.service';

@Injectable()
export class ClickupWriteTaskUseCase {
  constructor(
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly createTask: CreateTaskUseCase,
    private readonly updateTask: UpdateTaskUseCase,
    private readonly assembler: ClickupTaskAssembler,
    private readonly resolver: ClickupUserResolver,
  ) {}

  async create(principal: AuthPrincipal, listId: string, body: Record<string, any>) {
    const assignees = await this.resolver.toInternalIds(principal.workspaceId, Array.isArray(body.assignees) ? body.assignees : []);
    const created = await this.createTask.execute(principal, ClickupInputMapper.toCreate(listId, body, assignees));
    return this.fetch(principal, created.id);
  }

  async update(principal: AuthPrincipal, taskId: string, body: Record<string, any>) {
    const add = await this.resolver.toInternalIds(principal.workspaceId, Array.isArray(body.assignees?.add) ? body.assignees.add : []);
    const rem = await this.resolver.toInternalIds(principal.workspaceId, Array.isArray(body.assignees?.rem) ? body.assignees.rem : []);
    await this.updateTask.execute(principal, taskId, ClickupInputMapper.toUpdate(body, add, rem));
    return this.fetch(principal, taskId);
  }

  async fetch(principal: AuthPrincipal, taskId: string, includeSubtasks = false) {
    const task = await this.tasks.findByIdInWorkspace(taskId, principal.workspaceId);
    if (!task) throw new NotFoundException('Task not found');
    return (await this.assembler.assemble(principal.workspaceId, [task], includeSubtasks))[0];
  }
}
