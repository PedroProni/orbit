import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('Hierarchy and custom fields (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let admin: { token: string; id: string };
  let member: { token: string; id: string };
  let outsider: { token: string; id: string };
  let spaceId: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    admin = await ctx.login('admin@acme.test', 'Admin', 'admin');
    member = await ctx.login('member@acme.test', 'Member');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    spaceId = tree.body[0].id;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('seeds the default space with the seven statuses and their types', async () => {
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    expect(tree.body[0].statuses.map((s: { name: string; type: string }) => `${s.name}:${s.type}`)).toEqual(['backlog:open', 'to-do:open', 'stuck:active', 'in development:active', 'waiting review:review', 'in review:review', 'completed:done']);
  });

  it('member can read but not write structure', async () => {
    await ctx.http().get('/hierarchy').set(auth(member)).expect(200);
    await ctx.http().post('/spaces').set(auth(member)).send({ name: 'x' }).expect(403);
    await ctx.http().post(`/spaces/${spaceId}/folders`).set(auth(member)).send({ name: 'x' }).expect(403);
  });

  it('creates folders, lists and sprints with validation', async () => {
    const folder = await ctx.http().post(`/spaces/${spaceId}/folders`).set(auth(owner)).send({ name: 'Sprints' }).expect(201);
    const sprint = await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Sprint 18', kind: 'sprint', folderId: folder.body.id, startDate: '2026-11-01', endDate: '2026-11-14' }).expect(201);
    expect(sprint.body.kind).toBe('sprint');
    await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Bad', kind: 'sprint' }).expect(400);
    await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Bad', kind: 'sprint', startDate: '2026-11-14', endDate: '2026-11-01' }).expect(400);
    await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Bad', folderId: 'nope' }).expect(400);
    await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Bad', extra: 1 }).expect(400);
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    expect(tree.body[0].folders[0].lists[0].name).toBe('Sprint 18');
  });

  it('refuses to delete a non-empty folder and deletes an empty one', async () => {
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    const folderId = tree.body[0].folders[0].id;
    await ctx.http().delete(`/folders/${folderId}`).set(auth(owner)).expect(400);
    const listId = tree.body[0].folders[0].lists[0].id;
    await ctx.http().delete(`/lists/${listId}`).set(auth(owner)).expect(204);
    await ctx.http().delete(`/folders/${folderId}`).set(auth(owner)).expect(204);
    await ctx.http().delete(`/folders/${folderId}`).set(auth(owner)).expect(404);
  });

  it('validates status configuration', async () => {
    const bad = [{ name: 'a', color: '#111111', type: 'open' }, { name: 'a', color: '#111111', type: 'done' }];
    await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ statuses: bad }).expect(400);
    await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ statuses: [{ name: 'a', color: '#111111', type: 'open' }] }).expect(400);
    await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ statuses: [{ name: 'a', color: 'red', type: 'open' }] }).expect(400);
    const ok = await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ requiredTags: ['Back-End', 'bug'], titlePrefixes: ['P4T', 'SG'] }).expect(200);
    expect(ok.body.requiredTags).toEqual(['back-end', 'bug']);
    expect(ok.body.titlePrefixes).toEqual(['P4T', 'SG']);
  });

  it('lets the owner add a status after the seven, a task can use it, and a member cannot add one', async () => {
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    const current = tree.body[0].statuses.map((s: { name: string; color: string; type: string }) => ({ name: s.name, color: s.color, type: s.type }));
    const added = [...current, { name: 'Homologação', color: '#123456', type: 'review' }];
    await ctx.http().patch(`/spaces/${spaceId}`).set(auth(member)).send({ statuses: added }).expect(403);
    const saved = await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ statuses: added }).expect(200);
    expect(saved.body.statuses.map((s: { name: string }) => s.name)).toEqual(['backlog', 'to-do', 'stuck', 'in development', 'waiting review', 'in review', 'completed', 'Homologação']);
    const list = await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Com status novo' }).expect(201);
    const task = await ctx.http().post(`/lists/${list.body.id}/tasks`).set(auth(owner)).send({ title: '[P4T] Usa o status novo', status: 'Homologação', tags: ['bug'] }).expect(201);
    expect(task.body.status).toBe('Homologação');
    await ctx.http().delete(`/tasks/${task.body.id}`).set(auth(owner));
    await ctx.http().delete(`/lists/${list.body.id}`).set(auth(owner));
    await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ statuses: current }).expect(200);
  });

  it('keeps the seven default statuses locked and lets extras move only after them', async () => {
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    const current = tree.body[0].statuses.map((s: { name: string; color: string; type: string }) => ({ name: s.name, color: s.color, type: s.type }));
    const extraA = { name: 'Homologação', color: '#123456', type: 'review' };
    const extraB = { name: 'Aguardando cliente', color: '#654321', type: 'active' };
    const refused = [
      current.filter((s: { name: string }) => s.name !== 'stuck'),
      current.map((s: { name: string }) => (s.name === 'stuck' ? { ...s, name: 'blocked' } : s)),
      current.map((s: { name: string }) => (s.name === 'completed' ? { ...s, type: 'closed' } : s)),
      [current[1], current[0], ...current.slice(2)],
      [extraA, ...current],
    ];
    for (const statuses of refused) {
      const res = await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ statuses }).expect(400);
      expect(res.body.message).toBe('Default statuses cannot be removed, renamed or reordered');
    }
    const repeated = await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ statuses: [...current, { ...extraA, name: 'Backlog' }] }).expect(400);
    expect(repeated.body.message).toBe('Status names must be unique');
    const recolored = current.map((s: { color: string }) => ({ ...s, color: '#000000' }));
    const saved = await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ statuses: [...recolored, extraA, extraB] }).expect(200);
    expect(saved.body.statuses.slice(0, 7)).toEqual(current.map((s: object, order: number) => ({ ...s, order })));
    const swapped = await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ statuses: [...current, extraB, extraA] }).expect(200);
    expect(swapped.body.statuses.slice(7).map((s: { name: string }) => s.name)).toEqual(['Aguardando cliente', 'Homologação']);
    await ctx.http().patch(`/spaces/${spaceId}`).set(auth(admin)).send({ statuses: [...current, extraB] }).expect(200);
    await ctx.http().patch(`/spaces/${spaceId}`).set(auth(member)).send({ statuses: current }).expect(403);
    const after = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    expect(after.body[0].statuses.map((s: { name: string }) => s.name)).toEqual([...current.map((s: { name: string }) => s.name), 'Aguardando cliente']);
    await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ statuses: current }).expect(200);
  });

  it('is isolated across workspaces (IDOR)', async () => {
    const treeOut = await ctx.http().get('/hierarchy').set(auth(outsider)).expect(200);
    expect(treeOut.body.map((s: { id: string }) => s.id)).not.toContain(spaceId);
    await ctx.http().patch(`/spaces/${spaceId}`).set(auth(outsider)).send({ name: 'hijack' }).expect(404);
    await ctx.http().post(`/spaces/${spaceId}/folders`).set(auth(outsider)).send({ name: 'x' }).expect(404);
    await ctx.http().post(`/spaces/${spaceId}/custom-fields`).set(auth(outsider)).send({ name: 'x', type: 'url' }).expect(404);
  });

  it('manages custom fields', async () => {
    await ctx.http().post(`/spaces/${spaceId}/custom-fields`).set(auth(owner)).send({ name: 'Type', type: 'dropdown' }).expect(400);
    const dd = await ctx.http().post(`/spaces/${spaceId}/custom-fields`).set(auth(owner)).send({ name: 'Type', type: 'dropdown', options: ['bug', 'feature'] }).expect(201);
    expect(dd.body.options).toHaveLength(2);
    await ctx.http().post(`/spaces/${spaceId}/custom-fields`).set(auth(owner)).send({ name: 'Figma', type: 'url' }).expect(201);
    const list = await ctx.http().get(`/spaces/${spaceId}/custom-fields`).set(auth(member)).expect(200);
    expect(list.body).toHaveLength(2);
    await ctx.http().delete(`/custom-fields/${dd.body.id}`).set(auth(member)).expect(403);
    await ctx.http().delete(`/custom-fields/${dd.body.id}`).set(auth(owner)).expect(204);
  });
});
