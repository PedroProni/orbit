import { ConflictException, NotFoundException } from '@nestjs/common';
import { UnlinkTaskPullRequestUseCase } from './unlink-task-pull-request.use-case';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { PullRequestLinkSource } from '@domain/enums/pull-request-link.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const principal: AuthPrincipal = { workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'u1', userId: 'u1', role: UserRole.MEMBER, scopes: [] };
const link = (source: PullRequestLinkSource) =>
  new PullRequestLinkEntity({
    _id: 'p1',
    workspaceId: 'w1',
    taskId: 't1',
    repository: 'acme-org/orbit',
    number: 12,
    url: 'https://github.com/acme-org/orbit/pull/12',
    title: '',
    state: null,
    source,
    createdBy: 'u1',
    createdAt: new Date(0),
    updatedAt: new Date(0),
  });

const setup = (found: PullRequestLinkEntity | null) => {
  const links = { findOne: jest.fn().mockResolvedValue(found), delete: jest.fn().mockResolvedValue(undefined) };
  const access = { readable: jest.fn().mockResolvedValue({ getId: () => 't1' }) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return { links, audit, useCase: new UnlinkTaskPullRequestUseCase(links as never, access as never, audit as never) };
};

describe('UnlinkTaskPullRequestUseCase', () => {
  it('removes a manual link of the task and records it', async () => {
    const { useCase, links, audit } = setup(link(PullRequestLinkSource.MANUAL));
    await useCase.execute(principal, 't1', 'p1');
    expect(links.findOne).toHaveBeenCalledWith({ _id: 'p1', workspace_id: 'w1', task_id: 't1' });
    expect(links.delete).toHaveBeenCalledWith('p1');
    expect(audit.record).toHaveBeenCalledWith(principal, 'task.pull_request_unlinked', 'task', 't1', {
      changed: ['pullRequests'],
      diff: { pullRequests: { before: 'acme-org/orbit#12', after: null } },
    });
  });

  it('keeps a link that came from the GitHub webhook', async () => {
    const { useCase, links, audit } = setup(link(PullRequestLinkSource.WEBHOOK));
    await expect(useCase.execute(principal, 't1', 'p1')).rejects.toBeInstanceOf(ConflictException);
    expect(links.delete).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('answers not found for a link of another task or workspace', async () => {
    const { useCase, links } = setup(null);
    await expect(useCase.execute(principal, 't1', 'foreign')).rejects.toBeInstanceOf(NotFoundException);
    expect(links.delete).not.toHaveBeenCalled();
  });
});
