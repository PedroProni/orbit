import { BadRequestException } from '@nestjs/common';
import { LinkTaskPullRequestUseCase } from './link-task-pull-request.use-case';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { PullRequestLinkSource } from '@domain/enums/pull-request-link.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';

const principal: AuthPrincipal = { workspaceId: 'w1', actorType: AuditActorType.USER, actorId: 'u1', userId: 'u1', role: UserRole.MEMBER, scopes: [] };
const URL = 'https://github.com/acme-org/orbit/pull/12';
const existing = new PullRequestLinkEntity({
  _id: 'p1',
  workspaceId: 'w1',
  taskId: 't1',
  repository: 'acme-org/orbit',
  number: 12,
  url: URL,
  title: 'Ajusta login',
  state: null,
  source: PullRequestLinkSource.WEBHOOK,
  createdBy: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

const setup = (found: PullRequestLinkEntity | null = null) => {
  const links = { findForTask: jest.fn().mockResolvedValue(found), create: jest.fn().mockImplementation((entity: PullRequestLinkEntity) => Promise.resolve(entity)) };
  const access = { readable: jest.fn().mockResolvedValue({ getId: () => 't1' }) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return { links, access, audit, useCase: new LinkTaskPullRequestUseCase(links as never, access as never, audit as never) };
};

describe('LinkTaskPullRequestUseCase', () => {
  it('links a GitHub pull request by url as manual and records it in the activity', async () => {
    const { useCase, links, audit } = setup();
    const result = await useCase.execute(principal, 't1', ` ${URL}/files `);
    expect(result.created).toBe(true);
    expect(result.link).toEqual(expect.objectContaining({ taskId: 't1', repository: 'acme-org/orbit', number: 12, url: URL, source: 'manual', state: null }));
    expect(links.findForTask).toHaveBeenCalledWith('t1', 'acme-org/orbit', 12);
    expect(audit.record).toHaveBeenCalledWith(principal, 'task.pull_request_linked', 'task', 't1', {
      changed: ['pullRequests'],
      diff: { pullRequests: { before: null, after: 'acme-org/orbit#12' } },
    });
  });

  it('refuses a link that is not a GitHub pull request and writes nothing', async () => {
    const { useCase, links, audit } = setup();
    await expect(useCase.execute(principal, 't1', 'https://evil.example.com/a/b/pull/1')).rejects.toBeInstanceOf(BadRequestException);
    expect(links.create).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('returns the existing link on a replay instead of creating another', async () => {
    const { useCase, links, audit } = setup(existing);
    const result = await useCase.execute(principal, 't1', URL);
    expect(result.created).toBe(false);
    expect(result.link).toEqual(expect.objectContaining({ id: 'p1', source: 'webhook' }));
    expect(links.create).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('answers with the winner when a concurrent request hits the unique index', async () => {
    const { useCase, links, audit } = setup();
    links.create.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 11000 }));
    links.findForTask.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    const result = await useCase.execute(principal, 't1', URL);
    expect(result.created).toBe(false);
    expect(result.link.id).toBe('p1');
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('rethrows any other storage error', async () => {
    const { useCase, links } = setup();
    links.create.mockRejectedValueOnce(new Error('down'));
    await expect(useCase.execute(principal, 't1', URL)).rejects.toThrow('down');
  });
});
