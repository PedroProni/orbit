import { AutomationDateScheduler } from './automation-date-scheduler.service';
import { AutomationEntity } from '@domain/entities/automation.entity';
import { TaskEntity } from '@domain/entities/task.entity';
import { AutomationActionType, AutomationTriggerType } from '@domain/enums/automation.enums';
import { EMPTY_TASK_LINKS } from '@domain/constants/task-links.constant';

const NOW = new Date('2026-03-10T12:00:00.000Z');
const ARMED = new Date('2026-03-10T11:00:00.000Z');

const rule = (over: Partial<ConstructorParameters<typeof AutomationEntity>[0]> = {}) =>
  new AutomationEntity({
    _id: 'a1',
    workspaceId: 'w1',
    listId: null,
    name: 'rule',
    triggerType: AutomationTriggerType.DATE_REACHED,
    triggerValue: 'due_date',
    actionType: AutomationActionType.ADD_TAG,
    actionValue: 'vencida',
    actionUserIds: [],
    webhookSecretEnc: null,
    active: true,
    armedAt: ARMED,
    dateCursor: null,
    createdBy: 'u1',
    createdAt: ARMED,
    updatedAt: ARMED,
    ...over,
  });

const task = (id: string, dueDate: Date) =>
  new TaskEntity({
    _id: id,
    workspaceId: 'w1',
    spaceId: 's1',
    listId: 'l1',
    parentId: null,
    title: id,
    descriptionMd: '',
    status: 'to do',
    priority: null,
    tags: [],
    assigneeIds: [],
    watcherIds: [],
    points: null,
    startDate: null,
    dueDate,
    customFields: [],
    links: { ...EMPTY_TASK_LINKS },
    checklists: [],
    creatorId: 'u1',
    dateClosed: null,
    archived: false,
    clickupId: null,
    createdAt: ARMED,
    updatedAt: ARMED,
  });

const setup = (rules: AutomationEntity[], due: TaskEntity[]) => {
  const claimed = new Set<string>();
  const automations = { findMany: jest.fn().mockResolvedValue(rules), moveDateCursor: jest.fn().mockResolvedValue(undefined) };
  const tasks = { findMany: jest.fn().mockResolvedValue(due) };
  const runner = {
    fire: jest.fn().mockImplementation(async (a: AutomationEntity, _taskId: string, key: string) => {
      const id = `${a.getId()}|${key}`;
      if (claimed.has(id)) return false;
      claimed.add(id);
      return true;
    }),
  };
  const env = { getAutomationDateIntervalMs: () => 0 };
  return { scheduler: new AutomationDateScheduler(automations as never, tasks as never, runner as never, env as never), automations, tasks, runner };
};

describe('AutomationDateScheduler', () => {
  it('fires once per task date even when the window is scanned again', async () => {
    const dueAt = new Date('2026-03-10T11:30:00.000Z');
    const ctx = setup([rule()], [task('t1', dueAt)]);
    expect(await ctx.scheduler.tick(NOW)).toBe(1);
    expect(await ctx.scheduler.tick(NOW)).toBe(0);
    expect(ctx.runner.fire.mock.calls[0][2]).toBe(`date:t1:due_date:${dueAt.toISOString()}`);
    expect(ctx.runner.fire.mock.calls[1][2]).toBe(ctx.runner.fire.mock.calls[0][2]);
  });

  it('queries from armedAt, skipping closed and archived tasks, up to now', async () => {
    const ctx = setup([rule({ listId: 'l1' })], []);
    await ctx.scheduler.tick(NOW);
    expect(ctx.automations.findMany).toHaveBeenCalledWith({ active: true, trigger_type: AutomationTriggerType.DATE_REACHED }, { created_at: 1 });
    expect(ctx.tasks.findMany).toHaveBeenCalledWith({ workspace_id: 'w1', due_date: { $gt: ARMED, $lte: NOW }, archived: false, date_closed: null, list_id: 'l1' }, { due_date: 1, _id: 1 }, 200);
    expect(ctx.automations.moveDateCursor).toHaveBeenCalledWith('a1', ARMED, NOW);
  });

  it('looks back five minutes from the cursor but never before armedAt', async () => {
    const cursor = new Date('2026-03-10T11:58:00.000Z');
    const ctx = setup([rule({ triggerValue: 'start_date', dateCursor: cursor })], []);
    await ctx.scheduler.tick(NOW);
    expect(ctx.tasks.findMany.mock.calls[0][0].start_date).toEqual({ $gt: new Date('2026-03-10T11:53:00.000Z'), $lte: NOW });
    const early = setup([rule({ dateCursor: new Date('2026-03-10T11:02:00.000Z') })], []);
    await early.scheduler.tick(NOW);
    expect(early.tasks.findMany.mock.calls[0][0].due_date.$gt).toEqual(ARMED);
  });

  it('keeps the cursor at the last date when the batch is full so nothing is lost', async () => {
    const due = Array.from({ length: 200 }, (_, i) => task(`t${i}`, new Date(ARMED.getTime() + (i + 1) * 1000)));
    const ctx = setup([rule()], due);
    expect(await ctx.scheduler.tick(NOW)).toBe(200);
    const last = due[199].getDueDate() as Date;
    expect(ctx.automations.moveDateCursor).toHaveBeenCalledWith('a1', ARMED, new Date(last.getTime() + 5 * 60 * 1000 - 1));
  });

  it('ignores a rule with an unknown date field', async () => {
    const ctx = setup([rule({ triggerValue: 'created_at' })], [task('t1', NOW)]);
    expect(await ctx.scheduler.tick(NOW)).toBe(0);
    expect(ctx.tasks.findMany).not.toHaveBeenCalled();
  });
});
