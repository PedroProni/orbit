import { HandleGithubWebhookUseCase } from './handle-github-webhook.use-case';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { PullRequestLinkSource, PullRequestState } from '@domain/enums/pull-request-link.enums';
import { GithubPullRequestPayload } from '@domain/types/github-pull-request-payload.type';
import { PULL_REQUEST_GITHUB_FIELDS } from '@domain/constants/pull-request-link.constant';
import { GithubRefKind } from '@domain/enums/github.enums';
import { PullRequestLinkWriterService } from '@application/services/pull-request-link-writer.service';

const TASK_ID = '86abc1234';
const manualRow = () =>
  new PullRequestLinkEntity({
    _id: 'p1',
    workspaceId: 'w1',
    taskId: TASK_ID,
    repository: 'acme-org/orbit',
    number: 15,
    url: 'https://github.com/acme-org/orbit/pull/15',
    title: '',
    state: null,
    source: PullRequestLinkSource.MANUAL,
    createdBy: 'u1',
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
const payload = (action: string, merged = false): GithubPullRequestPayload => ({
  action,
  repository: { full_name: 'acme-org/orbit' },
  pull_request: { number: 15, title: `[P4T] fix ${TASK_ID} saldo`, html_url: 'https://github.com/acme-org/orbit/pull/15', merged, head: { ref: `fix/${TASK_ID}` } },
});
const duplicate = () => Object.assign(new Error('E11000 duplicate key'), { code: 11000 });

const setup = () => {
  const deliveries = { create: jest.fn().mockResolvedValue(undefined) };
  const links = { findForTask: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(undefined), patch: jest.fn().mockResolvedValue(undefined) };
  const task = { getWorkspaceId: () => 'w1', getId: () => TASK_ID, getSpaceId: () => 's1', getStatus: () => 'in development' };
  const tasks = { findOne: jest.fn().mockResolvedValue(task) };
  const spaces = { findByIdInWorkspace: jest.fn().mockResolvedValue({ hasStatus: () => true, isClosedStatus: () => false }) };
  const comments = { create: jest.fn().mockResolvedValue(undefined) };
  const updateTask = { execute: jest.fn().mockResolvedValue(undefined) };
  const writer = new PullRequestLinkWriterService(links as never, { getGithubRepositories: () => [] } as never);
  const refs = { record: jest.fn().mockResolvedValue(undefined), removeBranch: jest.fn().mockResolvedValue(1) };
  const sync = { refreshChecks: jest.fn().mockResolvedValue(0) };
  const useCase = new HandleGithubWebhookUseCase(deliveries as never, tasks as never, spaces as never, comments as never, updateTask as never, writer, refs as never, sync as never);
  return { useCase, deliveries, links, tasks, comments, updateTask, refs, sync };
};

describe('HandleGithubWebhookUseCase', () => {
  it('creates a webhook link for a new pull request and moves the task to review', async () => {
    const { useCase, links, updateTask } = setup();
    const outcome = await useCase.execute('d1', 'pull_request', payload('opened'));
    expect(outcome).toEqual({ status: 'processed', linked: [TASK_ID] });
    expect(links.create).toHaveBeenCalledWith(expect.objectContaining({ source: PullRequestLinkSource.WEBHOOK }));
    expect((links.create.mock.calls as PullRequestLinkEntity[][])[0][0].getState()).toBe(PullRequestState.OPEN);
    expect(updateTask.execute).toHaveBeenCalledWith(expect.objectContaining({ actorId: 'github' }), TASK_ID, { status: 'in review' });
  });

  it('updates the row a concurrent manual link created first instead of failing on the unique index', async () => {
    const { useCase, links, updateTask } = setup();
    const winner = manualRow();
    links.findForTask.mockResolvedValueOnce(null).mockResolvedValueOnce(winner);
    links.create.mockRejectedValueOnce(duplicate());
    await expect(useCase.execute('d2', 'pull_request', payload('opened'))).resolves.toEqual({ status: 'processed', linked: [TASK_ID] });
    expect(winner.getState()).toBe(PullRequestState.OPEN);
    expect(links.patch).toHaveBeenCalledWith(winner, [...PULL_REQUEST_GITHUB_FIELDS]);
    expect(updateTask.execute).toHaveBeenCalledTimes(1);
  });

  it('still writes the merged comment when the merge event loses the insert race', async () => {
    const { useCase, links, comments } = setup();
    const winner = manualRow();
    links.findForTask.mockResolvedValueOnce(null).mockResolvedValueOnce(winner);
    links.create.mockRejectedValueOnce(duplicate());
    await expect(useCase.execute('d3', 'pull_request', payload('closed', true))).resolves.toEqual({ status: 'processed', linked: [TASK_ID] });
    expect(winner.getState()).toBe(PullRequestState.MERGED);
    expect(comments.create).toHaveBeenCalledWith(expect.objectContaining({ actorId: 'github' }), TASK_ID, expect.stringContaining('Merged into homolog'), []);
  });

  it('rethrows a duplicate key error when no row can be read back, and any other storage error', async () => {
    const first = setup();
    first.links.create.mockRejectedValueOnce(duplicate());
    await expect(first.useCase.execute('d4', 'pull_request', payload('opened'))).rejects.toThrow('E11000');
    const second = setup();
    second.links.create.mockRejectedValueOnce(new Error('down'));
    await expect(second.useCase.execute('d5', 'pull_request', payload('opened'))).rejects.toThrow('down');
  });

  it('answers duplicate for a delivery id it already claimed and writes nothing', async () => {
    const { useCase, deliveries, links } = setup();
    deliveries.create.mockRejectedValueOnce(duplicate());
    expect(await useCase.execute('d1', 'pull_request', payload('opened'))).toEqual({ status: 'duplicate', linked: [] });
    expect(links.create).not.toHaveBeenCalled();
    expect(links.patch).not.toHaveBeenCalled();
  });

  it('reads the task id from the pull request body and keeps author, draft and head commit', async () => {
    const { useCase, links, tasks } = setup();
    const body: GithubPullRequestPayload = {
      action: 'opened',
      repository: { full_name: 'PedroProni/orbit-api' },
      pull_request: {
        number: 7,
        title: 'Ajusta o login',
        body: `Fecha ${TASK_ID}`,
        html_url: 'https://github.com/PedroProni/orbit-api/pull/7',
        draft: true,
        user: { login: 'dev', avatar_url: 'https://avatars.example/dev' },
        head: { ref: 'feat/login', sha: 'abc1234def' },
        updated_at: '2026-11-09T10:00:00Z',
      },
    };
    await expect(useCase.execute('d10', 'pull_request', body)).resolves.toEqual({ status: 'processed', linked: [TASK_ID] });
    expect(tasks.findOne).toHaveBeenCalledWith({ _id: TASK_ID });
    const created = (links.create.mock.calls as PullRequestLinkEntity[][])[0][0];
    expect([created.getAuthorLogin(), created.isDraft(), created.getHeadSha(), created.getHeadRef()]).toEqual(['dev', true, 'abc1234def', 'feat/login']);
  });

  it('updates data on edited and synchronize without moving the task or commenting', async () => {
    const { useCase, links, updateTask, comments } = setup();
    links.findForTask.mockResolvedValue(manualRow());
    await expect(useCase.execute('d11', 'pull_request', { ...payload('synchronize'), pull_request: { ...payload('synchronize').pull_request!, state: 'closed', merged: true } })).resolves.toEqual({
      status: 'processed',
      linked: [TASK_ID],
    });
    expect(links.patch).toHaveBeenCalledTimes(1);
    expect(updateTask.execute).not.toHaveBeenCalled();
    expect(comments.create).not.toHaveBeenCalled();
  });

  it('ignores pull request actions outside the known list', async () => {
    const { useCase, links } = setup();
    expect(await useCase.execute('d12', 'pull_request', payload('labeled'))).toEqual({ status: 'ignored', linked: [] });
    expect(links.findForTask).not.toHaveBeenCalled();
  });

  it('records branch and commits of a push for the task in the branch name or the commit message', async () => {
    const { useCase, refs } = setup();
    const sha = 'a'.repeat(40);
    const outcome = await useCase.execute('d13', 'push', {
      ref: `refs/heads/feat/${TASK_ID}-login`,
      repository: { full_name: 'PedroProni/orbit-api' },
      commits: [
        { id: sha, message: 'Ajusta login\n\ndetalhe', author: { username: 'dev' }, timestamp: '2026-11-09T10:00:00Z' },
        { id: 'nao-e-sha', message: TASK_ID },
      ],
    });
    expect(outcome).toEqual({ status: 'processed', linked: [TASK_ID] });
    expect(refs.record).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ kind: GithubRefKind.BRANCH, key: `feat/${TASK_ID}-login` }), expect.any(Date));
    expect(refs.record).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ kind: GithubRefKind.COMMIT, key: sha, title: 'Ajusta login', authorLogin: 'dev' }), expect.any(Date));
    expect(refs.record).toHaveBeenCalledTimes(2);
  });

  it('removes the branch on a deleting push and on a delete event, and ignores tags', async () => {
    const { useCase, refs } = setup();
    await useCase.execute('d14', 'push', { ref: `refs/heads/feat/${TASK_ID}`, deleted: true, repository: { full_name: 'PedroProni/orbit-api' } });
    await useCase.execute('d15', 'delete', { ref: `feat/${TASK_ID}`, ref_type: 'branch', repository: { full_name: 'PedroProni/orbit-api' } });
    expect(refs.removeBranch).toHaveBeenNthCalledWith(1, 'PedroProni/orbit-api', `feat/${TASK_ID}`);
    expect(refs.removeBranch).toHaveBeenCalledTimes(2);
    expect(await useCase.execute('d16', 'push', { ref: 'refs/tags/v1', repository: { full_name: 'PedroProni/orbit-api' } })).toEqual({ status: 'ignored', linked: [] });
    expect(await useCase.execute('d17', 'create', { ref: 'v1', ref_type: 'tag', repository: { full_name: 'PedroProni/orbit-api' } })).toEqual({ status: 'ignored', linked: [] });
  });

  it('records a created branch and passes check events to the checks refresh', async () => {
    const { useCase, refs, sync } = setup();
    await expect(useCase.execute('d18', 'create', { ref: `fix/${TASK_ID}`, ref_type: 'branch', repository: { full_name: 'PedroProni/orbit-api' } })).resolves.toEqual({
      status: 'processed',
      linked: [TASK_ID],
    });
    expect(refs.record).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ kind: GithubRefKind.BRANCH, key: `fix/${TASK_ID}` }), expect.any(Date));
    sync.refreshChecks.mockResolvedValueOnce(2);
    expect(await useCase.execute('d19', 'check_suite', { check_suite: { head_sha: 'abc1234' }, repository: { full_name: 'PedroProni/orbit-api' } })).toEqual({ status: 'processed', linked: [] });
    expect(await useCase.execute('d20', 'status', { sha: 'abc1234', repository: { full_name: 'PedroProni/orbit-api' } })).toEqual({ status: 'ignored', linked: [] });
    expect(sync.refreshChecks).toHaveBeenNthCalledWith(1, 'PedroProni/orbit-api', 'abc1234');
    expect(sync.refreshChecks).toHaveBeenCalledTimes(2);
  });
});
