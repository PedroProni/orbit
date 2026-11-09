import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('ClickUp compatibility /api/v2 (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let outsider: { token: string; id: string };
  let apiToken: string;
  let readToken: string;
  let listId: string;
  let teamId: string;
  const raw = (token: string) => ({ Authorization: token });
  const bearer = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });

  beforeAll(async () => {
    ctx = await createTestApp();
    const res = await ctx.http().post('/auth/dev-login').send({ email: 'owner@acme.test', name: 'Owner', clickupId: '1000001' }).expect(200);
    owner = { token: res.body.accessToken, id: res.body.user.id };
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other');
    apiToken = (await ctx.http().post('/api-tokens').set(bearer(owner)).send({ name: 'compat', scopes: ['workspace:read', 'tasks:read', 'tasks:write', 'comments:write', 'attachments:write'] }).expect(201)).body.token;
    readToken = (await ctx.http().post('/api-tokens').set(bearer(owner)).send({ name: 'ro', scopes: ['tasks:read'] }).expect(201)).body.token;
    const teams = await ctx.http().get('/api/v2/team').set(raw(readToken)).expect(403);
    expect(teams.body.ECODE).toBe('OAUTH_027');
    expect((await ctx.http().get('/api/v2/team').set(raw(apiToken)).expect(200)).body.teams[0].members[0].user.id).toBe(1000001);
    const tree = await ctx.http().get('/hierarchy').set(bearer(owner)).expect(200);
    listId = (await ctx.http().post(`/spaces/${tree.body[0].id}/lists`).set(bearer(owner)).send({ name: 'Backlog' }).expect(201)).body.id;
    teamId = '9000001';
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('creates a task with ClickUp shapes and returns it in the ClickUp format', async () => {
    const created = await ctx.http().post(`/api/v2/list/${listId}/task`).set(raw(apiToken)).send({ name: 'Compat task', markdown_description: '# hi', assignees: [1000001], priority: 2, due_date: 1793000000000, tags: ['bug'], status: 'to-do' }).expect(200);
    expect(created.body.id).toMatch(/^86/);
    expect(created.body.status).toMatchObject({ status: 'to-do' });
    expect(created.body.priority).toMatchObject({ id: '2', priority: 'high' });
    expect(created.body.assignees[0].id).toBe(1000001);
    expect(created.body.due_date).toBe('1793000000000');
    expect(typeof created.body.date_updated).toBe('string');
    expect(created.body.tags[0].name).toBe('bug');
    const got = await ctx.http().get(`/api/v2/task/${created.body.id}?include_subtasks=true`).set(raw(apiToken)).expect(200);
    expect(got.body.name).toBe('Compat task');
    expect(got.body.subtasks).toEqual([]);
    await ctx.http().post(`/api/v2/list/${listId}/task`).set(raw(apiToken)).send({}).expect(400);
  });

  it('serves the poller/handoff query: team tasks by assignee, closed excluded, date window, pagination flag', async () => {
    const t = await ctx.http().post(`/api/v2/list/${listId}/task`).set(raw(apiToken)).send({ name: 'Mine', assignees: [1000001] }).expect(200);
    await ctx.http().post(`/api/v2/list/${listId}/task`).set(raw(apiToken)).send({ name: 'Nobody' }).expect(200);
    const q = `/api/v2/team/${teamId}/task?assignees[]=1000001&include_closed=false&subtasks=true&page=0`;
    const res = await ctx.http().get(q).set(raw(apiToken)).expect(200);
    const names = res.body.tasks.map((x: { name: string }) => x.name);
    expect(names).toContain('Mine');
    expect(names).not.toContain('Nobody');
    expect(res.body.last_page).toBe(true);
    const other = await ctx.http().get(`/api/v2/team/${teamId}/task?assignees[]=999&page=0`).set(raw(apiToken)).expect(200);
    expect(other.body.tasks).toHaveLength(0);
    const future = await ctx.http().get(`${q}&date_updated_gt=${Date.now() + 100000}&date_updated_lt=${Date.now() + 200000}`).set(raw(apiToken)).expect(200);
    expect(future.body.tasks).toHaveLength(0);
    await ctx.http().put(`/api/v2/task/${t.body.id}`).set(raw(apiToken)).send({ status: 'deployed' }).expect(200);
    const closed = await ctx.http().get(q).set(raw(apiToken)).expect(200);
    expect(closed.body.tasks.map((x: { id: string }) => x.id)).not.toContain(t.body.id);
    const withClosed = await ctx.http().get(q.replace('include_closed=false', 'include_closed=true')).set(raw(apiToken)).expect(200);
    expect(withClosed.body.tasks.map((x: { id: string }) => x.id)).toContain(t.body.id);
  });

  it('maps the ClickUp status names our tools send to the seven statuses, on write and on filter', async () => {
    const t = await ctx.http().post(`/api/v2/list/${listId}/task`).set(raw(apiToken)).send({ name: 'Legacy status', status: 'in development', assignees: [1000001] }).expect(200);
    expect(t.body.status).toMatchObject({ status: 'in development' });
    const review = await ctx.http().put(`/api/v2/task/${t.body.id}`).set(raw(apiToken)).send({ status: 'testing' }).expect(200);
    expect(review.body.status).toMatchObject({ status: 'in review' });
    const byLegacy = await ctx.http().get(`/api/v2/team/${teamId}/task?statuses[]=testing&page=0`).set(raw(apiToken)).expect(200);
    expect(byLegacy.body.tasks.map((x: { id: string }) => x.id)).toContain(t.body.id);
    const stuck = await ctx.http().put(`/api/v2/task/${t.body.id}`).set(raw(apiToken)).send({ status: 'stuck' }).expect(200);
    expect(stuck.body.status).toMatchObject({ status: 'stuck' });
    const cancelled = await ctx.http().put(`/api/v2/task/${t.body.id}`).set(raw(apiToken)).send({ status: 'cancelled' }).expect(200);
    expect(cancelled.body.status).toMatchObject({ status: 'completed' });
    expect(cancelled.body.tags.map((x: { name: string }) => x.name)).toContain('cancelado');
    await ctx.http().put(`/api/v2/task/${t.body.id}`).set(raw(apiToken)).send({ status: 'shipping' }).expect(400);
  });

  it('runs the card flow: create task, one comment, rewrite it with PUT /comment/{id}, read comments back', async () => {
    const t = await ctx.http().post(`/api/v2/list/${listId}/task`).set(raw(apiToken)).send({ name: 'Card' }).expect(200);
    const c = await ctx.http().post(`/api/v2/task/${t.body.id}/comment`).set(raw(apiToken)).send({ comment_text: 'O que foi feito 04/11\n- a', notify_all: false }).expect(200);
    expect(c.body.id).toBeTruthy();
    await ctx.http().put(`/api/v2/comment/${c.body.id}`).set(raw(apiToken)).send({ comment_text: 'O que foi feito 04/11\n- a\n- b' }).expect(200);
    const list = await ctx.http().get(`/api/v2/task/${t.body.id}/comment`).set(raw(apiToken)).expect(200);
    expect(list.body.comments).toHaveLength(1);
    expect(list.body.comments[0].comment_text).toContain('- b');
    expect(list.body.comments[0].comment[0].text).toContain('- b');
    expect(list.body.comments[0].user.id).toBe(1000001);
    await ctx.http().post(`/api/v2/task/${t.body.id}/comment`).set(raw(apiToken)).send({}).expect(400);
  });

  it('accepts a multipart attachment and exposes ClickUp error shapes', async () => {
    const t = await ctx.http().post(`/api/v2/list/${listId}/task`).set(raw(apiToken)).send({ name: 'Att' }).expect(200);
    const up = await ctx.http().post(`/api/v2/task/${t.body.id}/attachment`).set(raw(apiToken)).attach('attachment', Buffer.from('hello'), 'prints.zip').expect(200);
    expect(up.body.title).toBe('prints.zip');
    expect(ctx.storage.objects.size).toBeGreaterThan(0);
    const missing = await ctx.http().get('/api/v2/task/86nope').set(raw(apiToken)).expect(404);
    expect(missing.body).toEqual({ err: 'Task not found', ECODE: 'ITEM_015' });
    await ctx.http().post(`/api/v2/task/${t.body.id}/attachment`).set(raw(apiToken)).expect(400);
  });

  it('enforces scopes, auth and workspace isolation on the compat surface', async () => {
    await ctx.http().get(`/api/v2/team/${teamId}/task`).expect(401);
    await ctx.http().get(`/api/v2/team/${teamId}/task`).set(raw('orb_invalid')).expect(401);
    await ctx.http().post(`/api/v2/list/${listId}/task`).set(raw(readToken)).send({ name: 'x' }).expect(403);
    await ctx.http().post(`/api/v2/list/${listId}/task`).set(bearer(outsider)).send({ name: 'x' }).expect(404);
    const t = await ctx.http().post(`/api/v2/list/${listId}/task`).set(raw(apiToken)).send({ name: 'Secret' }).expect(200);
    await ctx.http().get(`/api/v2/task/${t.body.id}`).set(bearer(outsider)).expect(404);
    await ctx.http().put(`/api/v2/task/${t.body.id}`).set(bearer(outsider)).send({ name: 'pwn' }).expect(404);
    await ctx.http().get(`/api/v2/task/${t.body.id}/comment`).set(bearer(outsider)).expect(404);
    const leak = await ctx.http().get(`/api/v2/team/${teamId}/task?subtasks=true`).set(bearer(outsider)).expect(200);
    expect(leak.body.tasks).toHaveLength(0);
  });
});
