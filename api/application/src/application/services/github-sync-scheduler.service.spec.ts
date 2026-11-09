import { GithubSyncScheduler } from './github-sync-scheduler.service';

const report = { repository: 'PedroProni/orbit-api', pullRequests: 1, branches: 2, commits: 3, removedBranches: 0 };
const setup = (interval: number, enabled = true) => {
  const env = { getGithubSyncIntervalMs: () => interval };
  const sync = { isEnabled: jest.fn(() => enabled), syncAll: jest.fn().mockResolvedValue([report]) };
  return { sync, scheduler: new GithubSyncScheduler(env as never, sync as never) };
};

describe('GithubSyncScheduler', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('does not start without an interval or when the sync is not enabled', async () => {
    for (const [interval, enabled] of [
      [0, true],
      [Number.NaN, true],
      [1000, false],
    ] as Array<[number, boolean]>) {
      const { sync, scheduler } = setup(interval, enabled);
      scheduler.onModuleInit();
      await jest.advanceTimersByTimeAsync(5000);
      expect(sync.syncAll).not.toHaveBeenCalled();
      scheduler.onModuleDestroy();
    }
  });

  it('runs a first round at once, then on every interval, and stops on destroy', async () => {
    const { sync, scheduler } = setup(1000);
    scheduler.onModuleInit();
    await jest.advanceTimersByTimeAsync(0);
    expect(sync.syncAll).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(2000);
    expect(sync.syncAll).toHaveBeenCalledTimes(3);
    scheduler.onModuleDestroy();
    await jest.advanceTimersByTimeAsync(5000);
    expect(sync.syncAll).toHaveBeenCalledTimes(3);
  });

  it('skips a tick while a round is still running and survives a failed round', async () => {
    const { sync, scheduler } = setup(1000);
    let finish: (value: unknown[]) => void = () => undefined;
    sync.syncAll.mockImplementationOnce(() => new Promise(resolve => (finish = resolve)));
    const first = scheduler.tick();
    await scheduler.tick();
    expect(sync.syncAll).toHaveBeenCalledTimes(1);
    finish([]);
    await first;
    sync.syncAll.mockRejectedValueOnce(new Error('down'));
    await expect(scheduler.tick()).resolves.toBeUndefined();
    await scheduler.tick();
    expect(sync.syncAll).toHaveBeenCalledTimes(3);
  });
});
