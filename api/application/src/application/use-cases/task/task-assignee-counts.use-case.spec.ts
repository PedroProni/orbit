import { TaskAssigneeCountsUseCase } from '@application/use-cases/task/task-assignee-counts.use-case';
import { TaskQueryFilterService } from '@application/services/task-query-filter.service';
import { ListTasksQuery } from '@application/commands/task/list-tasks.query';
import { TaskRepository } from '@domain/repositories/task.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';

describe('TaskAssigneeCountsUseCase', () => {
  const principal: AuthPrincipal = { workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'u1', userId: 'u1', role: UserRole.MEMBER, scopes: [] };
  const query: ListTasksQuery = {
    page: 1,
    limit: 50,
    includeClosed: true,
    includeArchived: false,
    orderBy: 'updated_at',
    reverse: false,
    listId: 'l1',
    statuses: ['doing'],
    assigneeIds: ['u2'],
    unassigned: true,
    parentId: 'p1',
    topLevel: false,
  };
  const counts = { total: 3, unassigned: 1, byAssignee: [{ assigneeId: 'u2', count: 2 }] };

  it('counts top level tasks under the other filters, ignoring the people and parent filters', async () => {
    const filters = { build: jest.fn().mockResolvedValue({ workspace_id: 'w1' }) };
    const tasks = { countByAssignee: jest.fn().mockResolvedValue(counts) };
    const useCase = new TaskAssigneeCountsUseCase(tasks as unknown as TaskRepository, filters as unknown as TaskQueryFilterService);
    await expect(useCase.execute(principal, query)).resolves.toEqual(counts);
    expect(filters.build).toHaveBeenCalledWith(principal, { ...query, assigneeIds: undefined, unassigned: false, parentId: undefined, topLevel: true });
    expect(tasks.countByAssignee).toHaveBeenCalledWith({ workspace_id: 'w1' });
  });

  it('returns zero counts without querying when the list is not visible', async () => {
    const filters = { build: jest.fn().mockResolvedValue(null) };
    const tasks = { countByAssignee: jest.fn() };
    const useCase = new TaskAssigneeCountsUseCase(tasks as unknown as TaskRepository, filters as unknown as TaskQueryFilterService);
    await expect(useCase.execute(principal, query)).resolves.toEqual({ total: 0, unassigned: 0, byAssignee: [] });
    expect(tasks.countByAssignee).not.toHaveBeenCalled();
  });
});
