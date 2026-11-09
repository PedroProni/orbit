import { Inject, Injectable } from '@nestjs/common';
import { TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { ListTasksQuery } from '@application/commands/task/list-tasks.query';
import { TaskQueryFilterService } from '@application/services/task-query-filter.service';
import { TaskPresenter } from '@application/presenters/task.presenter';

@Injectable()
export class ListTasksUseCase {
  constructor(
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly filters: TaskQueryFilterService,
  ) {}

  async execute(principal: AuthPrincipal, query: ListTasksQuery) {
    const filter = await this.filters.build(principal, query);
    if (!filter) return { data: [], total: 0, page: query.page, limit: query.limit };
    const result = await this.tasks.findPaged(filter, query.page, query.limit, { [query.orderBy]: query.reverse ? 1 : -1, _id: 1 });
    return { ...result, data: result.data.map(TaskPresenter.toView) };
  }
}
