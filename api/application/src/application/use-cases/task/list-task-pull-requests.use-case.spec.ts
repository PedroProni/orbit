import { NotFoundException } from '@nestjs/common';
import { ListTaskPullRequestsUseCase } from './list-task-pull-requests.use-case';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { PullRequestLinkSource, PullRequestState } from '@domain/enums/pull-request-link.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const principal: AuthPrincipal = { workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'g1', userId: 'g1', role: UserRole.GUEST, scopes: [] };
const link = new PullRequestLinkEntity({
  _id: 'p1',
  workspaceId: 'w1',
  taskId: 't1',
  repository: 'acme-org/orbit',
  number: 12,
  url: 'https://github.com/acme-org/orbit/pull/12',
  title: 'Ajusta login',
  state: PullRequestState.MERGED,
  source: PullRequestLinkSource.WEBHOOK,
  createdBy: null,
  authorLogin: null,
  authorAvatarUrl: null,
  headRef: null,
  headSha: null,
  draft: false,
  checksState: null,
  githubUpdatedAt: null,
  syncedAt: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

describe('ListTaskPullRequestsUseCase', () => {
  it('lists the pull requests of a readable task, newest first, inside the workspace', async () => {
    const links = { findMany: jest.fn().mockResolvedValue([link]) };
    const access = { readable: jest.fn().mockResolvedValue({ getId: () => 't1' }) };
    const result = await new ListTaskPullRequestsUseCase(links as never, access as never).execute(principal, 't1');
    expect(links.findMany).toHaveBeenCalledWith({ workspace_id: 'w1', task_id: 't1' }, { created_at: -1 }, 200);
    expect(result).toEqual([expect.objectContaining({ id: 'p1', state: 'merged', source: 'webhook', title: 'Ajusta login' })]);
  });

  it('reads nothing when the task is not readable', async () => {
    const links = { findMany: jest.fn() };
    const access = { readable: jest.fn().mockRejectedValue(new NotFoundException()) };
    await expect(new ListTaskPullRequestsUseCase(links as never, access as never).execute(principal, 't9')).rejects.toBeInstanceOf(NotFoundException);
    expect(links.findMany).not.toHaveBeenCalled();
  });
});
