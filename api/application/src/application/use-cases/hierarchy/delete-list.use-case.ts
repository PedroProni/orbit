import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TASK_LIST_INJECT_TOKEN, TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';

@Injectable()
export class DeleteListUseCase {
  constructor(
    @Inject(TASK_LIST_INJECT_TOKEN) private readonly lists: TaskListRepository,
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, listId: string): Promise<void> {
    const list = await this.lists.findByIdInWorkspace(listId, principal.workspaceId);
    if (!list) throw new NotFoundException('List not found');
    if ((await this.tasks.count({ list_id: listId })) > 0) throw new BadRequestException('List is not empty');
    await this.lists.delete(listId);
    await this.audit.record(principal, 'list.deleted', 'list', listId);
  }
}
