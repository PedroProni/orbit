import { TaskQueryFilterService } from '@application/services/task-query-filter.service';
import { GuestAccessService } from '@application/services/guest-access.service';
import { ListTasksQuery } from '@application/commands/task/list-tasks.query';
import { CommentRepository } from '@domain/repositories/comment.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { UserRole } from '@domain/enums/user.enums';

describe('TaskQueryFilterService', () => {
  const base: ListTasksQuery = { page: 1, limit: 50, includeClosed: true, includeArchived: false, orderBy: 'updated_at', reverse: false };
  const principal = (role: UserRole): AuthPrincipal => ({ workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'u1', userId: 'u1', role, scopes: [] });
  const setup = (allowed: string[] | null, taskIds: string[] = []) => {
    const comments = { findMany: jest.fn().mockResolvedValue(taskIds.map(id => ({ getTaskId: () => id }))) };
    const guests = { allowedListIds: jest.fn().mockResolvedValue(allowed) };
    return { comments, service: new TaskQueryFilterService(comments as unknown as CommentRepository, guests as unknown as GuestAccessService) };
  };

  it('builds the workspace filter for a member without touching comments when there is no search', async () => {
    const { comments, service } = setup(null);
    await expect(service.build(principal(UserRole.MEMBER), { ...base, topLevel: true })).resolves.toEqual({ workspace_id: 'w1', archived: false, parent_id: null });
    expect(comments.findMany).not.toHaveBeenCalled();
  });

  it('adds the tasks whose comments match the search, once each', async () => {
    const { comments, service } = setup(null, ['t1', 't1', 't2']);
    const filter = await service.build(principal(UserRole.MEMBER), { ...base, search: 'a.b' });
    expect(comments.findMany).toHaveBeenCalledWith({ workspace_id: 'w1', body_md: /a\.b/i }, { created_at: -1 }, 500);
    expect(JSON.stringify(filter)).toContain('"t1","t2"');
  });

  it('limits a guest to the shared lists and refuses a list that was not shared', async () => {
    const { service } = setup(['l1', 'l2']);
    await expect(service.build(principal(UserRole.GUEST), base)).resolves.toMatchObject({ list_id: { $in: ['l1', 'l2'] } });
    await expect(service.build(principal(UserRole.GUEST), { ...base, listId: 'l9' })).resolves.toBeNull();
    await expect(service.build(principal(UserRole.GUEST), { ...base, listId: 'l1' })).resolves.toMatchObject({ list_id: 'l1' });
  });
});
