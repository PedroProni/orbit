import { HandleGithubWebhookUseCase } from './handle-github-webhook.use-case';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { PullRequestLinkSource, PullRequestState } from '@domain/enums/pull-request-link.enums';
import { GithubPullRequestPayload } from '@domain/types/github-pull-request-payload.type';

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
  const useCase = new HandleGithubWebhookUseCase(deliveries as never, links as never, tasks as never, spaces as never, comments as never, updateTask as never);
  return { useCase, deliveries, links, comments, updateTask };
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
    expect(links.patch).toHaveBeenCalledWith(winner, ['title', 'url', 'state']);
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
});
