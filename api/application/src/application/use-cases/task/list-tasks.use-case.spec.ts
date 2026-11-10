import { ListTasksUseCase } from '@application/use-cases/task/list-tasks.use-case';
import { TaskQueryFilterService } from '@application/services/task-query-filter.service';
import { TaskAttachmentSummaryService } from '@application/services/task-attachment-summary.service';
import { TaskPresenter } from '@application/presenters/task.presenter';
import { ListTasksQuery } from '@application/commands/task/list-tasks.query';
import { TaskRepository } from '@domain/repositories/task.repository';
import { TaskEntity } from '@domain/entities/task.entity';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

describe('ListTasksUseCase', () => {
  const principal: AuthPrincipal = { workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'u1', userId: 'u1', role: UserRole.MEMBER, scopes: [] };
  const query = { page: 1, limit: 50, includeClosed: false, includeArchived: false, orderBy: 'updated_at', reverse: false, listId: 'l1', topLevel: false } as unknown as ListTasksQuery;
  const task = (id: string) => ({ getId: () => id }) as unknown as TaskEntity;

  afterEach(() => jest.restoreAllMocks());

  it('adds the file count and the cover of each task to the page', async () => {
    jest.spyOn(TaskPresenter, 'toView').mockImplementation(entity => ({ id: entity.getId() }) as ReturnType<typeof TaskPresenter.toView>);
    const tasks = { findPaged: jest.fn().mockResolvedValue({ data: [task('t1'), task('t2')], total: 2, page: 1, limit: 50 }) };
    const filters = { build: jest.fn().mockResolvedValue({ workspace_id: 'w1' }) };
    const summaries = { forTasks: jest.fn().mockResolvedValue(new Map([['t1', { attachmentCount: 3, coverAttachmentId: 'a1' }]])) };
    const useCase = new ListTasksUseCase(tasks as unknown as TaskRepository, filters as unknown as TaskQueryFilterService, summaries as unknown as TaskAttachmentSummaryService);
    const result = await useCase.execute(principal, query);
    expect(summaries.forTasks).toHaveBeenCalledWith(principal, [expect.anything(), expect.anything()]);
    expect(result.data).toEqual([
      { id: 't1', attachmentCount: 3, coverAttachmentId: 'a1' },
      { id: 't2', attachmentCount: 0, coverAttachmentId: null },
    ]);
  });

  it('returns an empty page without reading files when the list is not visible', async () => {
    const tasks = { findPaged: jest.fn() };
    const filters = { build: jest.fn().mockResolvedValue(null) };
    const summaries = { forTasks: jest.fn() };
    const useCase = new ListTasksUseCase(tasks as unknown as TaskRepository, filters as unknown as TaskQueryFilterService, summaries as unknown as TaskAttachmentSummaryService);
    await expect(useCase.execute(principal, query)).resolves.toEqual({ data: [], total: 0, page: 1, limit: 50, includeClosed: false });
    expect(tasks.findPaged).not.toHaveBeenCalled();
    expect(summaries.forTasks).not.toHaveBeenCalled();
  });
});
