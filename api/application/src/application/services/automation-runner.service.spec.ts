import { AutomationRunner } from './automation-runner.service';
import { AutomationEntity } from '@domain/entities/automation.entity';
import { AutomationRunEntity } from '@domain/entities/automation-run.entity';
import { TaskEntity } from '@domain/entities/task.entity';
import { SpaceEntity } from '@domain/entities/space.entity';
import { UserEntity } from '@domain/entities/user.entity';
import { AutomationActionType, AutomationTriggerType } from '@domain/enums/automation.enums';
import { AutomationRunStatus } from '@domain/enums/automation-run.enums';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { NotificationType } from '@domain/enums/notification.enums';
import { StatusType } from '@domain/enums/space.enums';
import { UserRole, UserStatus } from '@domain/enums/user.enums';
import { EMPTY_TASK_LINKS } from '@domain/constants/task-links.constant';
import { TaskEvent } from '@domain/types/task-event.type';

const automation = (actionType: AutomationActionType, actionValue: string, over: Partial<ConstructorParameters<typeof AutomationEntity>[0]> = {}) =>
  new AutomationEntity({
    _id: 'a1',
    workspaceId: 'w1',
    listId: null,
    name: 'rule',
    triggerType: AutomationTriggerType.TASK_CREATED,
    triggerValue: null,
    actionType,
    actionValue,
    actionUserIds: [],
    webhookSecretEnc: null,
    active: true,
    armedAt: new Date(),
    dateCursor: null,
    createdBy: 'u1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  });

const task = (over: Partial<ConstructorParameters<typeof TaskEntity>[0]> = {}) =>
  new TaskEntity({
    _id: 't1',
    workspaceId: 'w1',
    spaceId: 's1',
    listId: 'l1',
    parentId: null,
    title: 'Tarefa',
    descriptionMd: '',
    status: 'to do',
    priority: null,
    tags: [],
    assigneeIds: [],
    watcherIds: [],
    points: null,
    startDate: null,
    dueDate: null,
    customFields: [],
    links: { ...EMPTY_TASK_LINKS },
    checklists: [],
    creatorId: 'u1',
    dateClosed: null,
    archived: false,
    clickupId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  });

const space = () =>
  new SpaceEntity({
    _id: 's1',
    workspaceId: 'w1',
    name: 'Space',
    statuses: [
      { name: 'to do', color: '#000', type: StatusType.OPEN, order: 0 },
      { name: 'completed', color: '#000', type: StatusType.DONE, order: 1 },
    ],
    requiredTags: [],
    titlePrefixes: [],
    nextTaskSeq: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const user = (id: string, role: UserRole) =>
  new UserEntity({
    _id: id,
    workspaceId: 'w1',
    email: `${id}@acme.test`,
    name: id,
    avatarUrl: null,
    clickupId: null,
    role,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const event = (over: Partial<TaskEvent> = {}): TaskEvent => ({ workspaceId: 'w1', type: 'task.created', taskId: 't1', listId: 'l1', actorId: 'u1', at: new Date(), eventId: 'e1', ...over });

const setup = (rules: AutomationEntity[] = [], current: TaskEntity | null = task()) => {
  const automations = { findMany: jest.fn().mockResolvedValue(rules) };
  const runs = { claim: jest.fn().mockResolvedValue(true), finish: jest.fn().mockResolvedValue(undefined) };
  const tasks = { findByIdInWorkspace: jest.fn().mockResolvedValue(current) };
  const spaces = { findByIdInWorkspace: jest.fn().mockResolvedValue(space()) };
  const users = { findMany: jest.fn().mockResolvedValue([]) };
  const webhooks = { send: jest.fn().mockResolvedValue({ status: AutomationRunStatus.DONE, reason: null }) };
  const realtime = { all: jest.fn() };
  const updateTask = { execute: jest.fn().mockResolvedValue({}) };
  const comments = { create: jest.fn().mockResolvedValue({}) };
  const notifications = { notify: jest.fn().mockResolvedValue(undefined) };
  const guests = { allowedListIds: jest.fn().mockImplementation(async (p: { role: UserRole }) => (p.role === UserRole.GUEST ? ['other-list'] : null)) };
  const secrets = { reveal: jest.fn().mockReturnValue('plain-secret') };
  const runner = new AutomationRunner(
    automations as never,
    runs as never,
    tasks as never,
    spaces as never,
    users as never,
    webhooks as never,
    realtime as never,
    updateTask as never,
    comments as never,
    notifications as never,
    guests as never,
    secrets as never,
  );
  return { runner, automations, runs, tasks, users, webhooks, updateTask, comments, notifications, secrets };
};

const finished = (runs: { finish: jest.Mock }) => runs.finish.mock.calls.map(([, status, reason]) => ({ status, reason }));

describe('AutomationRunner', () => {
  it('ignores events written by the automation actor and events without an id', async () => {
    const ctx = setup([automation(AutomationActionType.ADD_TAG, 'auto')]);
    expect(await ctx.runner.handle(event({ actorId: 'automation' }))).toBe(0);
    expect(await ctx.runner.handle(event({ eventId: undefined }))).toBe(0);
    expect(ctx.automations.findMany).not.toHaveBeenCalled();
    expect(ctx.runs.claim).not.toHaveBeenCalled();
  });

  it('does nothing when another worker already claimed the trigger', async () => {
    const ctx = setup([automation(AutomationActionType.ADD_TAG, 'auto')]);
    ctx.runs.claim.mockResolvedValue(false);
    await ctx.runner.handle(event());
    expect(ctx.runs.claim.mock.calls[0][0]).toBeInstanceOf(AutomationRunEntity);
    expect((ctx.runs.claim.mock.calls[0][0] as AutomationRunEntity).getTriggerKey()).toBe('event:e1');
    expect(ctx.updateTask.execute).not.toHaveBeenCalled();
    expect(ctx.runs.finish).not.toHaveBeenCalled();
  });

  it('logs a thrown action as failed with the generic reason', async () => {
    const ctx = setup([automation(AutomationActionType.ADD_TAG, 'auto')]);
    ctx.updateTask.execute.mockRejectedValue(new Error('boom'));
    await ctx.runner.handle(event());
    expect(finished(ctx.runs)).toEqual([{ status: AutomationRunStatus.FAILED, reason: 'error' }]);
  });

  it('acts through the task use case as the automation system actor', async () => {
    const ctx = setup([
      automation(AutomationActionType.ASSIGN, 'u2'),
      automation(AutomationActionType.ADD_TAG, 'Auto', { _id: 'a2' }),
      automation(AutomationActionType.SET_PRIORITY, 'urgent', { _id: 'a3' }),
    ]);
    expect(await ctx.runner.handle(event())).toBe(3);
    const principal = ctx.updateTask.execute.mock.calls[0][0];
    expect(principal).toEqual({ workspaceId: 'w1', actorType: AuditActorType.SYSTEM, actorId: 'automation', userId: 'automation', role: UserRole.MEMBER, scopes: [] });
    expect(ctx.updateTask.execute.mock.calls.map(call => call[2])).toEqual([{ addAssigneeIds: ['u2'] }, { addTags: ['Auto'] }, { priority: 'urgent' }]);
    expect(finished(ctx.runs).every(r => r.status === AutomationRunStatus.DONE)).toBe(true);
  });

  it('skips with no_change when the task already has the value', async () => {
    const ctx = setup(
      [automation(AutomationActionType.ASSIGN, 'u2'), automation(AutomationActionType.ADD_TAG, 'Auto', { _id: 'a2' }), automation(AutomationActionType.SET_PRIORITY, 'high', { _id: 'a3' })],
      task({ assigneeIds: ['u2'], tags: ['auto'], priority: 'high' as never }),
    );
    await ctx.runner.handle(event());
    expect(ctx.updateTask.execute).not.toHaveBeenCalled();
    expect(finished(ctx.runs)).toEqual(Array(3).fill({ status: AutomationRunStatus.SKIPPED, reason: 'no_change' }));
  });

  it('resolves set_status in the task space and skips unknown or unchanged statuses', async () => {
    const ctx = setup([
      automation(AutomationActionType.SET_STATUS, 'deployed'),
      automation(AutomationActionType.SET_STATUS, 'shipping', { _id: 'a2' }),
      automation(AutomationActionType.SET_STATUS, 'to do', { _id: 'a3' }),
    ]);
    await ctx.runner.handle(event());
    expect(ctx.updateTask.execute).toHaveBeenCalledTimes(1);
    expect(ctx.updateTask.execute.mock.calls[0][2]).toEqual({ status: 'completed' });
    expect(finished(ctx.runs)).toEqual([
      { status: AutomationRunStatus.DONE, reason: null },
      { status: AutomationRunStatus.SKIPPED, reason: 'status_not_in_space' },
      { status: AutomationRunStatus.SKIPPED, reason: 'no_change' },
    ]);
  });

  it('skips when the task is gone', async () => {
    const ctx = setup([automation(AutomationActionType.COMMENT, 'Olá')], null);
    await ctx.runner.handle(event());
    expect(ctx.comments.create).not.toHaveBeenCalled();
    expect(finished(ctx.runs)).toEqual([{ status: AutomationRunStatus.SKIPPED, reason: 'task_not_found' }]);
  });

  it('writes comments as the automation actor', async () => {
    const ctx = setup([automation(AutomationActionType.COMMENT, 'Revisar')]);
    await ctx.runner.handle(event());
    expect(ctx.comments.create.mock.calls[0][0].userId).toBe('automation');
    expect(ctx.comments.create.mock.calls[0].slice(1)).toEqual(['t1', 'Revisar', []]);
  });

  it('notifies only users who can read the task, as the automation actor', async () => {
    const ctx = setup([automation(AutomationActionType.NOTIFY, 'users', { actionUserIds: ['m1', 'g1', 'gone'] })]);
    ctx.users.findMany.mockResolvedValue([user('m1', UserRole.MEMBER), user('g1', UserRole.GUEST)]);
    await ctx.runner.handle(event());
    expect(ctx.notifications.notify).toHaveBeenCalledWith('w1', ['m1'], NotificationType.AUTOMATION, 't1', 'automation');
  });

  it('skips notify when no recipient remains', async () => {
    const ctx = setup([automation(AutomationActionType.NOTIFY, 'watchers')]);
    await ctx.runner.handle(event());
    expect(ctx.notifications.notify).not.toHaveBeenCalled();
    expect(finished(ctx.runs)).toEqual([{ status: AutomationRunStatus.SKIPPED, reason: 'no_change' }]);
  });

  it('sends the webhook with the run id as delivery and fails when the secret cannot be read', async () => {
    const hook = automation(AutomationActionType.WEBHOOK, 'https://hooks.example.com/x', { webhookSecretEnc: 'enc' });
    const ctx = setup([hook]);
    ctx.webhooks.send.mockResolvedValue({ status: AutomationRunStatus.FAILED, reason: 'webhook_status_500' });
    await ctx.runner.handle(event());
    const [url, secret, payload] = ctx.webhooks.send.mock.calls[0];
    expect(url).toBe('https://hooks.example.com/x');
    expect(secret).toBe('plain-secret');
    expect(payload.delivery).toBe((ctx.runs.claim.mock.calls[0][0] as AutomationRunEntity).getId());
    expect(payload.task).toEqual({ id: 't1', title: 'Tarefa', status: 'to do', priority: null, listId: 'l1', spaceId: 's1' });
    expect(finished(ctx.runs)).toEqual([{ status: AutomationRunStatus.FAILED, reason: 'webhook_status_500' }]);
    const missing = setup([hook]);
    missing.secrets.reveal.mockReturnValue(null);
    await missing.runner.handle(event());
    expect(missing.webhooks.send).not.toHaveBeenCalled();
    expect(finished(missing.runs)).toEqual([{ status: AutomationRunStatus.FAILED, reason: 'error' }]);
  });
});
