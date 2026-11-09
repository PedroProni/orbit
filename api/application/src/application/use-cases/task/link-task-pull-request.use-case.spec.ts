import { BadRequestException } from '@nestjs/common';
import { LinkTaskPullRequestUseCase } from './link-task-pull-request.use-case';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { PullRequestLinkSource } from '@domain/enums/pull-request-link.enums';
import { UserRole } from '@domain/enums/user.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { PullRequestLinkWriterService } from '@application/services/pull-request-link-writer.service';

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

const setup = (found: PullRequestLinkEntity | null = null) => {
  const links = { findForTask: jest.fn().mockResolvedValue(found), create: jest.fn().mockImplementation((entity: PullRequestLinkEntity) => Promise.resolve(entity)), patch: jest.fn() };
  const access = { readable: jest.fn().mockResolvedValue({ getId: () => 't1' }) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const env = { getGithubRepositories: () => ['gl-back-end/Orbit'] };
  const sync = { enrichLink: jest.fn().mockImplementation((entity: PullRequestLinkEntity) => Promise.resolve(entity)) };
  const writer = new PullRequestLinkWriterService(links as never, env as never);
  return { links, access, audit, sync, useCase: new LinkTaskPullRequestUseCase(access as never, audit as never, writer, sync as never) };
};

describe('LinkTaskPullRequestUseCase', () => {
  it('links a GitHub pull request by url as manual and records it in the activity', async () => {
    const { useCase, links, audit, sync } = setup();
    const result = await useCase.execute(principal, 't1', ` ${URL}/files `);
    expect(result.created).toBe(true);
    expect(result.link).toEqual(expect.objectContaining({ taskId: 't1', repository: 'gl-back-end/Orbit', number: 12, url: URL, source: 'manual', state: null }));
    expect(links.findForTask).toHaveBeenCalledWith('t1', 'gl-back-end/Orbit', 12);
    expect(audit.record).toHaveBeenCalledWith(principal, 'task.pull_request_linked', 'task', 't1', {
      changed: ['pullRequests'],
      diff: { pullRequests: { before: null, after: 'gl-back-end/Orbit#12' } },
    });
    expect(sync.enrichLink).toHaveBeenCalledTimes(1);
  });

  it('returns the enriched link the sync service answers for a new link', async () => {
    const { useCase, sync } = setup();
    const enriched = new PullRequestLinkEntity({ ...existing.toProps(), _id: 'p9', title: 'Título do GitHub' });
    sync.enrichLink.mockResolvedValueOnce(enriched);
    const result = await useCase.execute(principal, 't1', URL);
    expect(result).toEqual({ created: true, link: expect.objectContaining({ id: 'p9', title: 'Título do GitHub' }) });
  });

  it('refuses a link that is not a GitHub pull request and writes nothing', async () => {
    const { useCase, links, audit } = setup();
    await expect(useCase.execute(principal, 't1', 'https://evil.example.com/a/b/pull/1')).rejects.toBeInstanceOf(BadRequestException);
    expect(links.create).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('returns the existing link on a replay instead of creating another', async () => {
    const { useCase, links, audit, sync } = setup(existing);
    const result = await useCase.execute(principal, 't1', URL);
    expect(result.created).toBe(false);
    expect(result.link).toEqual(expect.objectContaining({ id: 'p1', source: 'webhook' }));
    expect(links.create).not.toHaveBeenCalled();
    expect(links.patch).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
    expect(sync.enrichLink).not.toHaveBeenCalled();
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
