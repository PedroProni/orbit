import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('Docs, goals and dashboards (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let member: { token: string; id: string };
  let other: { token: string; id: string };
  let outsider: { token: string; id: string };
  let spaceId: string;
  let listId: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    member = await ctx.login('member@acme.test', 'Member');
    other = await ctx.login('other@acme.test', 'Other');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other-ws');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    spaceId = tree.body[0].id;
    listId = (await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'K' }).expect(201)).body.id;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('manages docs with nesting, cycle protection, archive and tenant isolation', async () => {
    const root = await ctx.http().post('/docs').set(auth(member)).send({ title: 'Manual', bodyMd: '# Olá', spaceId }).expect(201);
    const child = await ctx.http().post('/docs').set(auth(member)).send({ title: 'Capítulo', bodyMd: 'x', spaceId, parentId: root.body.id }).expect(201);
    await ctx.http().patch(`/docs/${root.body.id}`).set(auth(member)).send({ title: 'Manual', bodyMd: '# Olá', parentId: child.body.id }).expect(400);
    await ctx.http().patch(`/docs/${root.body.id}`).set(auth(member)).send({ title: 'Manual', bodyMd: '# Olá', parentId: root.body.id }).expect(400);
    await ctx.http().post('/docs').set(auth(member)).send({ title: '', bodyMd: 'x' }).expect(400);
    await ctx.http().post('/docs').set(auth(member)).send({ title: 'x', bodyMd: 'x', parentId: 'nope' }).expect(404);
    await ctx.http().post('/docs').set(auth(outsider)).send({ title: 'x', bodyMd: 'x', parentId: root.body.id }).expect(404);
    await ctx.http().get(`/docs/${root.body.id}`).set(auth(outsider)).expect(404);
    const listed = await ctx.http().get(`/docs?spaceId=${spaceId}`).set(auth(other)).expect(200);
    expect(listed.body.map((d: { title: string }) => d.title).sort()).toEqual(['Capítulo', 'Manual']);
    const updated = await ctx.http().patch(`/docs/${child.body.id}`).set(auth(other)).send({ title: 'Capítulo 1', bodyMd: 'novo', spaceId, parentId: root.body.id }).expect(200);
    expect(updated.body.bodyMd).toBe('novo');
    await ctx.http().delete(`/docs/${child.body.id}`).set(auth(member)).expect(204);
    await ctx.http().get(`/docs/${child.body.id}`).set(auth(member)).expect(404);
    const after = await ctx.http().get('/docs').set(auth(member)).expect(200);
    expect(after.body).toHaveLength(1);
  });

  it('computes goal progress from numeric and task targets and guards edits', async () => {
    const task = (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'Meta' }).expect(201)).body.id;
    const dto = { name: 'Q4', description: 'd', targets: [{ name: 'Receita', kind: 'number', targetValue: 200, currentValue: 50 }, { name: 'Entrega', kind: 'task', targetValue: 0, currentValue: 0, taskId: task }] };
    const goal = await ctx.http().post('/goals').set(auth(member)).send(dto).expect(201);
    expect(goal.body.progress).toBe(13);
    await ctx.http().patch(`/tasks/${task}`).set(auth(owner)).send({ status: 'completed' }).expect(200);
    const got = await ctx.http().get(`/goals/${goal.body.id}`).set(auth(owner)).expect(200);
    expect(got.body.progress).toBe(63);
    await ctx.http().post('/goals').set(auth(member)).send({ ...dto, targets: [{ name: 'x', kind: 'number', targetValue: 0, currentValue: 0 }] }).expect(400);
    await ctx.http().post('/goals').set(auth(member)).send({ ...dto, targets: [{ name: 'x', kind: 'task', targetValue: 0, currentValue: 0 }] }).expect(400);
    await ctx.http().post('/goals').set(auth(member)).send({ ...dto, targets: [{ name: 'x', kind: 'task', targetValue: 0, currentValue: 0, taskId: 'nope' }] }).expect(404);
    await ctx.http().patch(`/goals/${goal.body.id}`).set(auth(other)).send(dto).expect(403);
    await ctx.http().delete(`/goals/${goal.body.id}`).set(auth(other)).expect(403);
    await ctx.http().get(`/goals/${goal.body.id}`).set(auth(outsider)).expect(404);
    await ctx.http().patch(`/goals/${goal.body.id}`).set(auth(owner)).send({ ...dto, targets: [{ name: 'Receita', kind: 'number', targetValue: 200, currentValue: 400 }] }).expect(200);
    expect((await ctx.http().get(`/goals/${goal.body.id}`).set(auth(member)).expect(200)).body.progress).toBe(100);
    await ctx.http().delete(`/goals/${goal.body.id}`).set(auth(member)).expect(204);
  });

  it('builds dashboards, aggregates widgets and keeps private ones private', async () => {
    const a = (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'D1', assigneeIds: [member.id] }).expect(201)).body.id;
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'D2' }).expect(201);
    await ctx.http().post(`/tasks/${a}/time`).set(auth(member)).send({ minutes: 45 }).expect(201);
    const dto = { name: 'Painel', shared: false, widgets: [{ type: 'tasks_by_status', title: 'Status', listId }, { type: 'tasks_by_assignee', title: 'Pessoas' }, { type: 'overdue', title: 'Atrasadas' }, { type: 'time_tracked', title: 'Horas', listId }] };
    const dash = await ctx.http().post('/dashboards').set(auth(member)).send(dto).expect(201);
    const data = await ctx.http().get(`/dashboards/${dash.body.id}/data`).set(auth(member)).expect(200);
    const byType = Object.fromEntries(data.body.widgets.map((w: { type: string; result: unknown }) => [w.type, w.result]));
    expect(Object.values(byType.tasks_by_status as Record<string, number>).reduce((x, y) => x + y, 0)).toBeGreaterThanOrEqual(2);
    expect((byType.tasks_by_assignee as Record<string, number>)[member.id]).toBe(1);
    expect(byType.overdue).toEqual({ count: 0 });
    expect((byType.time_tracked as Record<string, number>)[member.id]).toBe(45);
    await ctx.http().get(`/dashboards/${dash.body.id}/data`).set(auth(other)).expect(404);
    await ctx.http().get(`/dashboards/${dash.body.id}/data`).set(auth(outsider)).expect(404);
    expect((await ctx.http().get('/dashboards').set(auth(other)).expect(200)).body).toEqual([]);
    await ctx.http().patch(`/dashboards/${dash.body.id}`).set(auth(member)).send({ ...dto, shared: true }).expect(200);
    await ctx.http().get(`/dashboards/${dash.body.id}/data`).set(auth(other)).expect(200);
    await ctx.http().patch(`/dashboards/${dash.body.id}`).set(auth(other)).send(dto).expect(403);
    await ctx.http().post('/dashboards').set(auth(member)).send({ ...dto, widgets: [{ type: 'bogus', title: 'x' }] }).expect(400);
    await ctx.http().post('/dashboards').set(auth(member)).send({ ...dto, widgets: [{ type: 'overdue', title: 'x', listId: 'nope' }] }).expect(404);
    await ctx.http().delete(`/dashboards/${dash.body.id}`).set(auth(other)).expect(403);
    await ctx.http().delete(`/dashboards/${dash.body.id}`).set(auth(member)).expect(204);
  });

  it('counts a task as overdue in the widget only after its due day, whatever the hour stored', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const dash = await ctx.http().post('/dashboards').set(auth(member)).send({ name: 'Atraso', shared: false, widgets: [{ type: 'overdue', title: 'Atrasadas', listId }] }).expect(201);
    const count = async () => (await ctx.http().get(`/dashboards/${dash.body.id}/data`).set(auth(member)).expect(200)).body.widgets[0].result.count as number;
    const before = await count();
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'Vence hoje', dueDate: `${today}T00:00:00.000Z` }).expect(201);
    expect(await count()).toBe(before);
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'Venceu ontem', dueDate: `${yesterday}T23:59:59.000Z` }).expect(201);
    expect(await count()).toBe(before + 1);
  });
});
