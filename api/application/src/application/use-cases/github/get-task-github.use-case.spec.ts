import { GetTaskGithubUseCase } from './get-task-github.use-case';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { PullRequestLinkSource } from '@domain/enums/pull-request-link.enums';
import { GithubRefKind } from '@domain/enums/github.enums';

const principal = { userId: 'u1', workspaceId: 'w1', role: 'guest' };
const link = PullRequestLinkEntity.fromSeed({
  _id: 'p1',
  workspaceId: 'w1',
  taskId: '86abc1234',
  repository: 'PedroProni/orbit-api',
  number: 3,
  url: 'https://github.com/PedroProni/orbit-api/pull/3',
  source: PullRequestLinkSource.SYNC,
  createdBy: null,
  now: new Date(0),
});

const setup = () => {
  const syncedAt = new Date('2026-11-09T10:00:00Z');
  const links = { findMany: jest.fn().mockResolvedValue([link]) };
  const refs = { findMany: jest.fn().mockResolvedValue([]) };
  const states = { lastSuccess: jest.fn().mockResolvedValue(syncedAt) };
  const access = { readable: jest.fn().mockResolvedValue({ getId: () => '86abc1234' }) };
  const sync = {
    isEnabled: () => true,
    repositories: () => ['PedroProni/orbit-api', 'PedroProni/orbit'],
    taskKey: (id: string) => `task:${id}`,
    repositoryKey: (name: string) => `repo:${name.toLowerCase()}`,
  };
  return { links, refs, states, access, syncedAt, useCase: new GetTaskGithubUseCase(links as never, refs as never, states as never, access as never, sync as never) };
};

describe('GetTaskGithubUseCase', () => {
  it('reads only rows of the readable task in the principal workspace and reports the latest sync', async () => {
    const { links, refs, states, access, syncedAt, useCase } = setup();
    const view = await useCase.execute(principal as never, '86ABC1234');
    expect(access.readable).toHaveBeenCalledWith(principal, '86ABC1234');
    expect(links.findMany).toHaveBeenCalledWith({ workspace_id: 'w1', task_id: '86abc1234' }, { created_at: -1 }, 200);
    expect(refs.findMany).toHaveBeenCalledWith({ workspace_id: 'w1', task_id: '86abc1234', kind: GithubRefKind.BRANCH }, { key: 1 }, 100);
    expect(refs.findMany).toHaveBeenCalledWith({ workspace_id: 'w1', task_id: '86abc1234', kind: GithubRefKind.COMMIT }, { occurred_at: -1, created_at: -1 }, 100);
    expect(states.lastSuccess).toHaveBeenCalledWith(['task:86abc1234', 'repo:pedroproni/orbit-api', 'repo:pedroproni/orbit']);
    expect(view).toEqual({ pullRequests: [expect.objectContaining({ id: 'p1', source: 'sync', checksState: null })], branches: [], commits: [], syncEnabled: true, syncedAt });
  });

  it('refuses a task the principal cannot read without querying any GitHub row', async () => {
    const { links, refs, access, useCase } = setup();
    access.readable.mockRejectedValueOnce(new Error('Task not found'));
    await expect(useCase.execute(principal as never, '86zzz9999')).rejects.toThrow('Task not found');
    expect(links.findMany).not.toHaveBeenCalled();
    expect(refs.findMany).not.toHaveBeenCalled();
  });
});
