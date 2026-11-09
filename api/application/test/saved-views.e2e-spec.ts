import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('Saved views (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let member: { token: string; id: string };
  let other: { token: string; id: string };
  let outsider: { token: string; id: string };
  let listId: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
  const body = (extra: Record<string, unknown> = {}) => ({
    name: 'Minhas abertas',
    viewType: 'table',
    filters: { statuses: ['to-do'], assigneeIds: [], tags: [], q: '', includeClosed: false },
    ...extra,
  });

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    member = await ctx.login('member@acme.test', 'Member');
    other = await ctx.login('other@acme.test', 'Other');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other-ws');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    const list = await ctx.http().post(`/spaces/${tree.body[0].id}/lists`).set(auth(owner)).send({ name: 'Views' }).expect(201);
    listId = list.body.id;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('creates, lists, updates and deletes a private view', async () => {
    const created = await ctx.http().post('/saved-views').set(auth(member)).send(body({ listId })).expect(201);
    expect(created.body.shared).toBe(false);
    expect(created.body.ownerId).toBe(member.id);
    const listed = await ctx.http().get(`/saved-views?listId=${listId}`).set(auth(member)).expect(200);
    expect(listed.body.map((v: { id: string }) => v.id)).toContain(created.body.id);
    const updated = await ctx
      .http()
      .patch(`/saved-views/${created.body.id}`)
      .set(auth(member))
      .send(body({ name: 'Renomeada', viewType: 'calendar', listId }))
      .expect(200);
    expect(updated.body.name).toBe('Renomeada');
    expect(updated.body.viewType).toBe('calendar');
    await ctx.http().delete(`/saved-views/${created.body.id}`).set(auth(member)).expect(204);
    const after = await ctx.http().get('/saved-views').set(auth(member)).expect(200);
    expect(after.body.map((v: { id: string }) => v.id)).not.toContain(created.body.id);
  });

  it('hides private views from others and shares on request', async () => {
    const priv = await ctx.http().post('/saved-views').set(auth(member)).send(body()).expect(201);
    const shared = await ctx
      .http()
      .post('/saved-views')
      .set(auth(member))
      .send(body({ name: 'Time', shared: true }))
      .expect(201);
    const seen = await ctx.http().get('/saved-views').set(auth(other)).expect(200);
    const ids = seen.body.map((v: { id: string }) => v.id);
    expect(ids).toContain(shared.body.id);
    expect(ids).not.toContain(priv.body.id);
    await ctx.http().patch(`/saved-views/${priv.body.id}`).set(auth(other)).send(body()).expect(404);
    await ctx.http().delete(`/saved-views/${priv.body.id}`).set(auth(other)).expect(404);
  });

  it('only the owner or an admin changes a shared view', async () => {
    const shared = await ctx
      .http()
      .post('/saved-views')
      .set(auth(member))
      .send(body({ name: 'Compartilhada', shared: true }))
      .expect(201);
    await ctx
      .http()
      .patch(`/saved-views/${shared.body.id}`)
      .set(auth(other))
      .send(body({ name: 'hack' }))
      .expect(403);
    await ctx.http().delete(`/saved-views/${shared.body.id}`).set(auth(other)).expect(403);
    await ctx
      .http()
      .patch(`/saved-views/${shared.body.id}`)
      .set(auth(owner))
      .send(body({ name: 'Admin', shared: true }))
      .expect(200);
  });

  it('stores the display options, keeps them on an update that omits them and clears them with null', async () => {
    const display = {
      groupBy: 'assignee',
      swimlane: 'priority',
      sortBy: 'dueDate',
      sortDirection: 'desc',
      cardFields: ['priority', 'subtasks'],
      hideEmpty: true,
      collapsedColumns: ['completed'],
      wipLimits: [{ column: 'in development', limit: 3 }],
    };
    const created = await ctx
      .http()
      .post('/saved-views')
      .set(auth(member))
      .send(body({ name: 'Com exibição', display }))
      .expect(201);
    expect(created.body.display).toEqual(display);
    const listed = await ctx.http().get('/saved-views').set(auth(member)).expect(200);
    expect(listed.body.find((v: { id: string }) => v.id === created.body.id).display).toEqual(display);
    const kept = await ctx
      .http()
      .patch(`/saved-views/${created.body.id}`)
      .set(auth(member))
      .send(body({ name: 'Mantida' }))
      .expect(200);
    expect(kept.body.display).toEqual(display);
    const changed = await ctx
      .http()
      .patch(`/saved-views/${created.body.id}`)
      .set(auth(member))
      .send(body({ display: { ...display, groupBy: 'tag' } }))
      .expect(200);
    expect(changed.body.display.groupBy).toBe('tag');
    const cleared = await ctx
      .http()
      .patch(`/saved-views/${created.body.id}`)
      .set(auth(member))
      .send(body({ display: null }))
      .expect(200);
    expect(cleared.body.display).toBeNull();
  });

  it('returns a null display for a view saved before the field existed', async () => {
    const created = await ctx
      .http()
      .post('/saved-views')
      .set(auth(member))
      .send(body({ name: 'Antiga', display: { groupBy: 'tag', swimlane: 'none', sortBy: 'manual', sortDirection: 'asc', cardFields: [], hideEmpty: false, collapsedColumns: [], wipLimits: [] } }))
      .expect(201);
    await ctx.app
      .get<Connection>(getConnectionToken())
      .collection('saved_views')
      .updateOne({ _id: created.body.id } as never, { $unset: { display: '' } });
    const listed = await ctx.http().get('/saved-views').set(auth(member)).expect(200);
    expect(listed.body.find((v: { id: string }) => v.id === created.body.id).display).toBeNull();
  });

  it('refuses invalid display options', async () => {
    const valid = { groupBy: 'status', swimlane: 'none', sortBy: 'manual', sortDirection: 'asc', cardFields: [], hideEmpty: false, collapsedColumns: [], wipLimits: [] };
    const send = (display: unknown) => ctx.http().post('/saved-views').set(auth(member)).send(body({ display })).expect(400);
    await send({ ...valid, groupBy: 'nope' });
    await send({ ...valid, swimlane: 'nope' });
    await send({ ...valid, sortBy: 'nope' });
    await send({ ...valid, sortDirection: 'sideways' });
    await send({ ...valid, cardFields: ['nope'] });
    await send({ ...valid, hideEmpty: 'yes' });
    await send({ ...valid, wipLimits: [{ column: 'x', limit: 0 }] });
    await send({ ...valid, wipLimits: [{ column: 'x', limit: 1000 }] });
    await send({ ...valid, collapsedColumns: Array.from({ length: 101 }, (_, i) => `c${i}`) });
    await send({ ...valid, collapsedColumns: ['x'.repeat(121)] });
    await send({ ...valid, unknown: true });
    await send('text');
  });

  it('keeps the no assignee filter of a view and refuses a value that is not a boolean', async () => {
    const filters = { statuses: [], assigneeIds: [member.id], tags: [], q: '', includeClosed: true, unassigned: true };
    const created = await ctx.http().post('/saved-views').set(auth(member)).send(body({ listId, filters })).expect(201);
    expect(created.body.filters).toEqual(filters);
    const listed = await ctx.http().get(`/saved-views?listId=${listId}`).set(auth(member)).expect(200);
    expect(listed.body.find((v: { id: string }) => v.id === created.body.id).filters.unassigned).toBe(true);
    await ctx
      .http()
      .post('/saved-views')
      .set(auth(member))
      .send(body({ listId, filters: { ...filters, unassigned: 'yes' } }))
      .expect(400);
    await ctx
      .http()
      .post('/saved-views')
      .set(auth(member))
      .send(body({ listId, filters: { ...filters, extra: 1 } }))
      .expect(400);
  });

  it('validates input and the referenced list', async () => {
    await ctx
      .http()
      .post('/saved-views')
      .set(auth(member))
      .send(body({ name: '' }))
      .expect(400);
    await ctx
      .http()
      .post('/saved-views')
      .set(auth(member))
      .send(body({ viewType: 'nope' }))
      .expect(400);
    await ctx.http().post('/saved-views').set(auth(member)).send({ name: 'x', viewType: 'list' }).expect(400);
    await ctx
      .http()
      .post('/saved-views')
      .set(auth(member))
      .send(body({ listId: 'missing' }))
      .expect(404);
  });

  it('is isolated across workspaces and respects token scopes', async () => {
    const shared = await ctx
      .http()
      .post('/saved-views')
      .set(auth(member))
      .send(body({ name: 'Visível', shared: true }))
      .expect(201);
    const foreign = await ctx.http().get('/saved-views').set(auth(outsider)).expect(200);
    expect(foreign.body).toEqual([]);
    await ctx.http().patch(`/saved-views/${shared.body.id}`).set(auth(outsider)).send(body()).expect(404);
    await ctx.http().post('/saved-views').set(auth(outsider)).send(body({ listId })).expect(404);
    const token = await ctx
      .http()
      .post('/api-tokens')
      .set(auth(owner))
      .send({ name: 'ro', scopes: ['tasks:read'] })
      .expect(201);
    await ctx.http().get('/saved-views').set({ Authorization: token.body.token }).expect(200);
    await ctx.http().post('/saved-views').set({ Authorization: token.body.token }).send(body()).expect(403);
  });
});
