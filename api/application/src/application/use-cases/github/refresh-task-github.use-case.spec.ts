import { RefreshTaskGithubUseCase } from './refresh-task-github.use-case';
import { GithubError } from '@domain/errors/github.error';

const principal = { userId: 'u1', workspaceId: 'w1', role: 'member' };
const setup = (enabled = true, claimed = true) => {
  const task = { getId: () => '86abc1234' };
  const states = { claim: jest.fn().mockResolvedValue(claimed), finish: jest.fn().mockResolvedValue(undefined) };
  const access = { readable: jest.fn().mockResolvedValue(task) };
  const sync = { isEnabled: jest.fn(() => enabled), taskKey: (id: string) => `task:${id}`, refreshTask: jest.fn().mockResolvedValue(undefined) };
  const view = { execute: jest.fn().mockResolvedValue({ pullRequests: [], branches: [], commits: [], syncEnabled: true, syncedAt: null }) };
  return { states, access, sync, view, useCase: new RefreshTaskGithubUseCase(states as never, access as never, sync as never, view as never) };
};

describe('RefreshTaskGithubUseCase', () => {
  it('checks access first, refreshes the task, records the round and returns the view', async () => {
    const { states, access, sync, view, useCase } = setup();
    await expect(useCase.execute(principal as never, '86ABC1234')).resolves.toEqual(expect.objectContaining({ syncEnabled: true }));
    expect(access.readable).toHaveBeenCalledWith(principal, '86ABC1234');
    expect(states.claim).toHaveBeenCalledWith('task:86abc1234', expect.any(Date), 30000);
    expect(sync.refreshTask).toHaveBeenCalledTimes(1);
    expect(states.finish).toHaveBeenCalledWith('task:86abc1234', expect.any(Date), {});
    expect(view.execute).toHaveBeenCalledWith(principal, '86abc1234');
  });

  it('answers 409 when the server has no GitHub token, before claiming anything', async () => {
    const { states, sync, useCase } = setup(false);
    const error = (await useCase.execute(principal as never, '86abc1234').catch((e: unknown) => e)) as GithubError;
    expect(error).toBeInstanceOf(GithubError);
    expect(error.status).toBe(409);
    expect(states.claim).not.toHaveBeenCalled();
    expect(sync.refreshTask).not.toHaveBeenCalled();
  });

  it('answers 429 inside the cooldown and never calls GitHub', async () => {
    const { sync, states, useCase } = setup(true, false);
    const error = (await useCase.execute(principal as never, '86abc1234').catch((e: unknown) => e)) as GithubError;
    expect(error.status).toBe(429);
    expect(error.message).toBe('GitHub refresh: GITHUB_REFRESH_COOLDOWN');
    expect(sync.refreshTask).not.toHaveBeenCalled();
    expect(states.finish).not.toHaveBeenCalled();
  });

  it('refuses a task the principal cannot read before touching the sync state', async () => {
    const { access, states, useCase } = setup();
    access.readable.mockRejectedValueOnce(new Error('Task not found'));
    await expect(useCase.execute(principal as never, '86zzz9999')).rejects.toThrow('Task not found');
    expect(states.claim).not.toHaveBeenCalled();
  });
});
