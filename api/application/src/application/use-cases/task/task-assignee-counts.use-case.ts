import { Inject, Injectable } from '@nestjs/common';
import { TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AssigneeCounts } from '@domain/types/assignee-counts.type';
import { ListTasksQuery } from '@application/commands/task/list-tasks.query';
import { TaskQueryFilterService } from '@application/services/task-query-filter.service';

@Injectable()
export class TaskAssigneeCountsUseCase {
  constructor(
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly filters: TaskQueryFilterService,
  ) {}

  async execute(principal: AuthPrincipal, query: ListTasksQuery): Promise<AssigneeCounts> {
    const filter = await this.filters.build(principal, { ...query, assigneeIds: undefined, unassigned: false, parentId: undefined, topLevel: true });
    if (!filter) return { total: 0, unassigned: 0, byAssignee: [] };
    return this.tasks.countByAssignee(filter);
  }
}
