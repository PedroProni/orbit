import { Inject, Injectable } from '@nestjs/common';
import { TASK_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { CLICKUP_PAGE_SIZE } from '@domain/constants/clickup-compat.constant';
import { TaskFilterBuilder } from '@application/services/task-filter.builder';
import { ClickupTaskAssembler } from '@application/services/compat/clickup-task-assembler.service';
import { ClickupUserResolver } from '@application/services/compat/clickup-user-resolver.service';

const arr = (value: unknown): string[] | undefined => (value === undefined ? undefined : (Array.isArray(value) ? value : [value]).map(String));
const date = (value: unknown): Date | undefined => (value === undefined || value === '' ? undefined : new Date(Number(value)));

@Injectable()
export class ClickupListTasksUseCase {
  constructor(
    @Inject(TASK_INJECT_TOKEN) private readonly tasks: TaskRepository,
    private readonly assembler: ClickupTaskAssembler,
    private readonly resolver: ClickupUserResolver,
  ) {}

  async execute(principal: AuthPrincipal, q: Record<string, any>, scope: { listId?: string } = {}) {
    const page = Math.max(0, Number(q.page ?? 0) || 0);
    const external = arr(q['assignees[]'] ?? q.assignees);
    const assigneeIds = external ? await this.resolver.toInternalIds(principal.workspaceId, external) : undefined;
    const orderBy = q.order_by === 'created' ? 'created_at' : q.order_by === 'due_date' ? 'due_date' : 'updated_at';
    const filter = TaskFilterBuilder.build(principal.workspaceId, {
      page: page + 1,
      limit: CLICKUP_PAGE_SIZE,
      listId: scope.listId ?? arr(q['list_ids[]'])?.[0],
      spaceId: arr(q['space_ids[]'])?.[0],
      statuses: arr(q['statuses[]']),
      assigneeIds: external ? (assigneeIds!.length ? assigneeIds : ['__none__']) : undefined,
      tags: arr(q['tags[]']),
      includeClosed: q.include_closed === 'true',
      includeArchived: q.archived === 'true',
      updatedAfter: date(q.date_updated_gt),
      updatedBefore: date(q.date_updated_lt),
      createdAfter: date(q.date_created_gt),
      dueAfter: date(q.due_date_gt),
      dueBefore: date(q.due_date_lt),
      orderBy,
      reverse: q.reverse === 'true',
    }, []);
    if (q.subtasks !== 'true') filter.parent_id = null;
    const result = await this.tasks.findPaged(filter, page + 1, CLICKUP_PAGE_SIZE, { [orderBy]: q.reverse === 'true' ? 1 : -1, _id: 1 });
    return { tasks: await this.assembler.assemble(principal.workspaceId, result.data), last_page: result.data.length < CLICKUP_PAGE_SIZE || (page + 1) * CLICKUP_PAGE_SIZE >= result.total };
  }
}
