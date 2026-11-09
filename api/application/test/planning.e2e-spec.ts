import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';
import { CreateTaskUseCase } from '../src/application/use-cases/task/create-task.use-case';
import { TaskRecurrenceUseCase } from '../src/application/use-cases/planning/task-recurrence.use-case';

describe('Planning (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let member: { token: string; id: string };
  let outsider: { token: string; id: string };
  let spaceId: string;
  let listId: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
  const mk = async (title: string, who = owner) => (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(who)).send({ title }).expect(201)).body.id as string;

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    member = await ctx.login('member@acme.test', 'Member');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other-ws');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    spaceId = tree.body[0].id;
    listId = (await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Plan' }).expect(201)).body.id;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('adds dependencies, rejects self, duplicate and cycles, and hides them across workspaces', async () => {
    const a = await mk('A');
    const b = await mk('B');
    const c = await mk('C');
    await ctx.http().post(`/tasks/${b}/dependencies`).set(auth(owner)).send({ dependsOnId: a }).expect(201);
    await ctx.http().post(`/tasks/${c}/dependencies`).set(auth(owner)).send({ dependsOnId: b }).expect(201);
    await ctx.http().post(`/tasks/${b}/dependencies`).set(auth(owner)).send({ dependsOnId: a }).expect(409);
    await ctx.http().post(`/tasks/${a}/dependencies`).set(auth(owner)).send({ dependsOnId: a }).expect(400);
    await ctx.http().post(`/tasks/${a}/dependencies`).set(auth(owner)).send({ dependsOnId: c }).expect(400);
    const listed = await ctx.http().get(`/tasks/${b}/dependencies`).set(auth(member)).expect(200);
    expect(listed.body).toEqual({ blockedBy: [a], blocking: [c] });
    await ctx.http().get(`/tasks/${b}/dependencies`).set(auth(outsider)).expect(404);
    await ctx.http().post(`/tasks/${b}/dependencies`).set(auth(outsider)).send({ dependsOnId: a }).expect(404);
    await ctx.http().delete(`/tasks/${c}/dependencies/${b}`).set(auth(owner)).expect(204);
    await ctx.http().delete(`/tasks/${c}/dependencies/${b}`).set(auth(owner)).expect(404);
    await ctx.http().post(`/tasks/${a}/dependencies`).set(auth(owner)).send({ dependsOnId: c }).expect(201);
  });

  it('stores estimates and task kind and validates ranges', async () => {
    const t = await mk('Estimate');
    const initial = await ctx.http().get(`/tasks/${t}/plan`).set(auth(member)).expect(200);
    expect(initial.body).toMatchObject({ taskKind: 'task', estimateMinutes: null, trackedMinutes: 0 });
    const changed = await ctx.http().patch(`/tasks/${t}/plan`).set(auth(member)).send({ estimateMinutes: 120, taskKind: 'bug' }).expect(200);
    expect(changed.body).toMatchObject({ taskKind: 'bug', estimateMinutes: 120, remainingMinutes: 120 });
    await ctx.http().patch(`/tasks/${t}/plan`).set(auth(member)).send({ estimateMinutes: -5 }).expect(400);
    await ctx.http().patch(`/tasks/${t}/plan`).set(auth(member)).send({ taskKind: 'nope' }).expect(400);
    await ctx.http().patch(`/tasks/${t}/plan`).set(auth(outsider)).send({ estimateMinutes: 1 }).expect(404);
  });

  it('tracks time with one running timer per user and author-only deletion', async () => {
    const t = await mk('Timer');
    const t2 = await mk('Timer 2');
    await ctx.http().patch(`/tasks/${t}/plan`).set(auth(owner)).send({ estimateMinutes: 60 }).expect(200);
    await ctx.http().post(`/tasks/${t}/time/start`).set(auth(member)).expect(201);
    await ctx.http().post(`/tasks/${t2}/time/start`).set(auth(member)).expect(409);
    await ctx.http().post(`/tasks/${t2}/time/stop`).set(auth(member)).expect(404);
    const stopped = await ctx.http().post(`/tasks/${t}/time/stop`).set(auth(member)).expect(201);
    expect(stopped.body.running).toBe(false);
    expect(stopped.body.minutes).toBeGreaterThanOrEqual(1);
    const manual = await ctx.http().post(`/tasks/${t}/time`).set(auth(member)).send({ minutes: 30 }).expect(201);
    await ctx.http().post(`/tasks/${t}/time`).set(auth(member)).send({ minutes: 0 }).expect(400);
    const sum = await ctx.http().get(`/tasks/${t}/time`).set(auth(owner)).expect(200);
    expect(sum.body.totalMinutes).toBe(stopped.body.minutes + 30);
    const plan = await ctx.http().get(`/tasks/${t}/plan`).set(auth(owner)).expect(200);
    expect(plan.body.trackedMinutes).toBe(sum.body.totalMinutes);
    expect(plan.body.remainingMinutes).toBe(Math.max(0, 60 - sum.body.totalMinutes));
    const other = await ctx.login('other@acme.test', 'Other');
    await ctx.http().delete(`/time-entries/${manual.body.id}`).set(auth(other)).expect(403);
    await ctx.http().delete(`/time-entries/${manual.body.id}`).set(auth(outsider)).expect(404);
    await ctx.http().delete(`/time-entries/${manual.body.id}`).set(auth(owner)).expect(204);
  });

  it('creates tasks from templates with plan data and rejects foreign spaces', async () => {
    const dto = { spaceId, name: 'Bug padrão', titleTemplate: 'Corrigir bug', descriptionMd: 'Passos', tags: ['Bug', 'bug', ' '], priority: 'high', taskKind: 'bug', estimateMinutes: 90 };
    const tpl = await ctx.http().post('/task-templates').set(auth(member)).send(dto).expect(201);
    expect(tpl.body.tags).toEqual(['bug']);
    await ctx.http().post('/task-templates').set(auth(outsider)).send(dto).expect(404);
    await ctx.http().post('/task-templates').set(auth(member)).send({ ...dto, titleTemplate: '' }).expect(400);
    const created = await ctx.http().post(`/task-templates/${tpl.body.id}/instantiate`).set(auth(member)).send({ listId }).expect(201);
    expect(created.body.title).toBe('Corrigir bug');
    const plan = await ctx.http().get(`/tasks/${created.body.id}/plan`).set(auth(member)).expect(200);
    expect(plan.body).toMatchObject({ taskKind: 'bug', estimateMinutes: 90 });
    await ctx.http().post(`/task-templates/${tpl.body.id}/instantiate`).set(auth(outsider)).send({ listId }).expect(404);
    const listed = await ctx.http().get(`/task-templates?spaceId=${spaceId}`).set(auth(owner)).expect(200);
    expect(listed.body).toHaveLength(1);
    await ctx.http().delete(`/task-templates/${tpl.body.id}`).set(auth(owner)).expect(204);
    await ctx.http().delete(`/task-templates/${tpl.body.id}`).set(auth(owner)).expect(404);
  });

  it('stores the task kind sent on create and writes no plan when the kind is missing, invalid or the create is refused', async () => {
    const plans = ctx.app.get<Connection>(getConnectionToken()).collection('task_plans');
    const created = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'Com tipo', taskKind: 'milestone' }).expect(201);
    const plan = await ctx.http().get(`/tasks/${created.body.id}/plan`).set(auth(member)).expect(200);
    expect(plan.body).toMatchObject({ taskKind: 'milestone', estimateMinutes: null });
    expect(await plans.countDocuments({ task_id: created.body.id })).toBe(1);
    const plain = await mk('Sem tipo', member);
    expect(await plans.countDocuments({ task_id: plain })).toBe(0);
    expect((await ctx.http().get(`/tasks/${plain}/plan`).set(auth(member)).expect(200)).body.taskKind).toBe('task');
    const before = await plans.countDocuments({});
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'Tipo errado', taskKind: 'epic' }).expect(400);
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'Pessoa errada', taskKind: 'bug', assigneeIds: ['nobody'] }).expect(400);
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(outsider)).send({ title: 'Fora', taskKind: 'bug' }).expect(404);
    const guest = await ctx.login('guest-kind@acme.test', 'Guest', 'guest');
    const refused = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(guest)).send({ title: 'Convidado', taskKind: 'bug' });
    expect(refused.status).toBe(403);
    expect(await plans.countDocuments({})).toBe(before);
  });

  it('spawns a recurring task exactly once per due run even when run concurrently', async () => {
    const t = await mk('Recorrente');
    const past = new Date(Date.now() - 3600000).toISOString();
    await ctx.http().put(`/tasks/${t}/recurrence`).set(auth(member)).send({ frequency: 'daily', interval: 0 }).expect(400);
    const rule = await ctx.http().put(`/tasks/${t}/recurrence`).set(auth(member)).send({ frequency: 'daily', interval: 1, firstRunAt: past }).expect(200);
    expect(rule.body).toMatchObject({ frequency: 'daily', interval: 1, active: true });
    await ctx.http().put(`/tasks/${t}/recurrence`).set(auth(outsider)).send({ frequency: 'daily', interval: 1 }).expect(404);
    const recurrence = ctx.app.get(TaskRecurrenceUseCase);
    const results = await Promise.all([recurrence.runDue(), recurrence.runDue(), recurrence.runDue()]);
    expect(results.reduce((a, b) => a + b, 0)).toBe(1);
    const after = await ctx.http().get(`/tasks/${t}/recurrence`).set(auth(owner)).expect(200);
    expect(after.body.lastCreatedTaskId).toBeTruthy();
    expect(new Date(after.body.nextRunAt).getTime()).toBeGreaterThan(Date.now());
    expect(await recurrence.runDue()).toBe(0);
    const spawned = await ctx.http().get(`/tasks/${after.body.lastCreatedTaskId}`).set(auth(owner)).expect(200);
    expect(spawned.body.title).toBe('Recorrente');
    await ctx.http().delete(`/tasks/${t}/recurrence`).set(auth(owner)).expect(204);
    await ctx.http().delete(`/tasks/${t}/recurrence`).set(auth(owner)).expect(404);
  });

  it('drops the rule when the source task is gone and skips a run without duplicating when task creation fails', async () => {
    const past = new Date(Date.now() - 3600000).toISOString();
    const recurrence = ctx.app.get(TaskRecurrenceUseCase);
    const gone = await mk('Origem removida');
    await ctx.http().put(`/tasks/${gone}/recurrence`).set(auth(member)).send({ frequency: 'daily', interval: 1, firstRunAt: past }).expect(200);
    await ctx.http().delete(`/tasks/${gone}`).set(auth(owner)).expect(204);
    expect(await recurrence.runDue()).toBe(0);
    const dropped = await ctx.http().get(`/tasks/${gone}/recurrence`).set(auth(owner)).expect(200);
    expect(dropped.body.taskId).toBeUndefined();
    const failing = await mk('Falha ao criar');
    await ctx.http().put(`/tasks/${failing}/recurrence`).set(auth(member)).send({ frequency: 'daily', interval: 1, firstRunAt: past }).expect(200);
    const createTask = ctx.app.get(CreateTaskUseCase);
    const spy = jest.spyOn(createTask, 'execute').mockRejectedValueOnce(new Error('boom'));
    expect(await recurrence.runDue()).toBe(0);
    spy.mockRestore();
    const after = await ctx.http().get(`/tasks/${failing}/recurrence`).set(auth(owner)).expect(200);
    expect(after.body.lastCreatedTaskId).toBeNull();
    expect(new Date(after.body.nextRunAt).getTime()).toBeGreaterThan(Date.now());
    expect(await recurrence.runDue()).toBe(0);
  });
});
