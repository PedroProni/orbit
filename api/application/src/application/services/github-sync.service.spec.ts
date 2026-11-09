import { GithubSyncService } from './github-sync.service';
import { PullRequestLinkWriterService } from './pull-request-link-writer.service';
import { GithubError } from '@domain/errors/github.error';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { PullRequestLinkSource } from '@domain/enums/pull-request-link.enums';

const REPOS = ['PedroProni/orbit-api', 'PedroProni/orbit-frontend'];
const fullPage = (prefix: string) => Array.from({ length: 100 }, (_, index) => ({ name: `${prefix}-${index}`, sha: 'abc1234' }));
const manual = (repository: string) =>
  PullRequestLinkEntity.fromSeed({ _id: 'p1', workspaceId: 'w1', taskId: '86abc1234', repository, number: 3, url: 'u', source: PullRequestLinkSource.MANUAL, createdBy: 'u1', now: new Date(0) });

const setup = (configured = true) => {
  const github = {
    isConfigured: jest.fn(() => configured),
    listPullRequests: jest.fn().mockResolvedValue([]),
    getPullRequest: jest.fn().mockResolvedValue(null),
    listPullRequestCommits: jest.fn().mockResolvedValue([]),
    listBranches: jest.fn().mockResolvedValue([]),
    listCommits: jest.fn().mockResolvedValue([]),
    listCheckRuns: jest.fn().mockResolvedValue([]),
    getCombinedStatus: jest.fn().mockResolvedValue({ state: '', totalCount: 0 }),
    searchPullRequests: jest.fn().mockResolvedValue([]),
  };
  const states = { claim: jest.fn().mockResolvedValue(true), findById: jest.fn().mockResolvedValue(null), finish: jest.fn(), release: jest.fn(), lastSuccess: jest.fn() };
  const links = { findInRepository: jest.fn().mockResolvedValue([]), findMany: jest.fn().mockResolvedValue([]), findForTask: jest.fn().mockResolvedValue(null), create: jest.fn(), patch: jest.fn() };
  const tasks = { findOne: jest.fn().mockResolvedValue(null) };
  const env = { getGithubRepositories: () => REPOS };
  const refs = { record: jest.fn(), removeBranch: jest.fn(), removeBranchesNotIn: jest.fn().mockResolvedValue(0) };
  const writer = new PullRequestLinkWriterService(links as never, env as never);
  const service = new GithubSyncService(github, states as never, links as never, tasks as never, writer, refs as never, env as never);
  return { service, github, states, links, tasks, refs };
};

describe('GithubSyncService', () => {
  it('does nothing at all without a token', async () => {
    const { service, github, states } = setup(false);
    expect(service.isEnabled()).toBe(false);
    expect(await service.syncAll()).toEqual([]);
    expect(states.claim).not.toHaveBeenCalled();
    expect(github.listPullRequests).not.toHaveBeenCalled();
  });

  it('skips a repository another instance holds and releases every lock it took', async () => {
    const { service, states, github } = setup();
    states.claim.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const reports = await service.syncAll();
    expect(reports.map(report => report.repository)).toEqual(['PedroProni/orbit-frontend']);
    expect(github.listPullRequests).toHaveBeenCalledWith('PedroProni/orbit-frontend', 1);
    expect(github.listPullRequests).not.toHaveBeenCalledWith('PedroProni/orbit-api', expect.anything());
    expect(states.release).toHaveBeenCalledTimes(1);
    expect(states.finish).toHaveBeenCalledWith('repo:pedroproni/orbit-frontend', expect.any(Date), expect.objectContaining({ commitCursor: expect.any(Date) }));
  });

  it('stops the round on a rate limit, keeps the cursor untouched and still releases the lock', async () => {
    const { service, states, github } = setup();
    github.listPullRequests.mockRejectedValueOnce(new GithubError('GITHUB_RATE_LIMITED', 'pulls.list', 503));
    expect(await service.syncAll()).toEqual([]);
    expect(states.claim).toHaveBeenCalledTimes(1);
    expect(states.finish).not.toHaveBeenCalled();
    expect(states.release).toHaveBeenCalledWith('repo:pedroproni/orbit-api');
  });

  it('keeps the branches, the cursors and the last success of a repository GitHub stops answering, and still syncs the next one', async () => {
    const { service, states, github, refs } = setup();
    const gone = new GithubError('GITHUB_REPOSITORY_UNAVAILABLE', 'branches.list', 502, 404);
    github.listBranches.mockImplementation((repository: string) => (repository === 'PedroProni/orbit-api' ? Promise.reject(gone) : Promise.resolve([{ name: 'main', sha: 'abc1234' }])));
    const reports = await service.syncAll();
    expect(reports.map(report => report.repository)).toEqual(['PedroProni/orbit-frontend']);
    expect(refs.removeBranchesNotIn).toHaveBeenCalledTimes(1);
    expect(refs.removeBranchesNotIn).toHaveBeenCalledWith('PedroProni/orbit-frontend', ['main'], expect.any(Date));
    expect(states.finish).toHaveBeenCalledTimes(1);
    expect(states.finish).not.toHaveBeenCalledWith('repo:pedroproni/orbit-api', expect.anything(), expect.anything());
    expect(states.release).toHaveBeenCalledWith('repo:pedroproni/orbit-api');
    expect(github.listCommits).not.toHaveBeenCalledWith('PedroProni/orbit-api', expect.anything(), expect.anything());
  });

  it('skips a repository GitHub stops answering during a task refresh but stops on any other failure', async () => {
    const task = { getId: () => '86abc1234', getWorkspaceId: () => 'w1' };
    const skipped = setup();
    skipped.github.listBranches.mockImplementation((repository: string) =>
      repository === 'PedroProni/orbit-api'
        ? Promise.reject(new GithubError('GITHUB_REPOSITORY_UNAVAILABLE', 'branches.list', 502, 404))
        : Promise.resolve([{ name: 'feat/86abc1234-tela', sha: 'abc1234' }]),
    );
    await expect(skipped.service.refreshTask(task as never)).resolves.toBeUndefined();
    expect(skipped.refs.record).toHaveBeenCalledTimes(1);
    expect(skipped.refs.record).toHaveBeenCalledWith(task, expect.objectContaining({ repository: 'PedroProni/orbit-frontend', key: 'feat/86abc1234-tela' }), expect.any(Date));
    const failed = setup();
    failed.github.listBranches.mockRejectedValue(new GithubError('GITHUB_REQUEST_FAILED', 'branches.list', 502, 500));
    await expect(failed.service.refreshTask(task as never)).rejects.toMatchObject({ code: 'GITHUB_REQUEST_FAILED' });
  });

  it('removes vanished branches only after reading the complete branch list', async () => {
    const complete = setup();
    complete.github.listBranches.mockResolvedValueOnce([{ name: 'main', sha: 'abc1234' }]);
    await complete.service.syncRepository('PedroProni/orbit-api', null, new Date());
    expect(complete.refs.removeBranchesNotIn).toHaveBeenCalledWith('PedroProni/orbit-api', ['main'], expect.any(Date));
    const partial = setup();
    partial.github.listBranches.mockImplementation((_: string, page: number) => Promise.resolve(fullPage(`p${page}`)));
    await partial.service.syncRepository('PedroProni/orbit-api', null, new Date());
    expect(partial.github.listBranches).toHaveBeenCalledTimes(5);
    expect(partial.refs.removeBranchesNotIn).not.toHaveBeenCalled();
  });

  it('does not enrich a manual link of a repository outside the list, and survives a GitHub failure', async () => {
    const { service, github } = setup();
    const outside = manual('someone/private');
    expect(await service.enrichLink(outside)).toBe(outside);
    expect(github.getPullRequest).not.toHaveBeenCalled();
    github.getPullRequest.mockRejectedValueOnce(new GithubError('GITHUB_TIMEOUT', 'pulls.get', 502));
    const listed = manual('pedroproni/orbit-api');
    expect(await service.enrichLink(listed)).toBe(listed);
    expect(github.getPullRequest).toHaveBeenCalledWith('PedroProni/orbit-api', 3);
  });

  it('refreshes checks only for listed repositories and valid commit ids', async () => {
    const { service, links } = setup();
    expect(await service.refreshChecks('someone/private', 'abc1234')).toBe(0);
    expect(await service.refreshChecks('PedroProni/orbit-api', 'main')).toBe(0);
    expect(links.findInRepository).not.toHaveBeenCalled();
  });
});
