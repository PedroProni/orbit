import { request as httpRequest } from 'node:http';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('Search and events (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let outsider: { token: string; id: string };
  let listId: string;
  let port: number;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    listId = (await ctx.http().post(`/spaces/${tree.body[0].id}/lists`).set(auth(owner)).send({ name: 'L' }).expect(201)).body.id;
    await ctx.app.listen(0);
    port = ctx.app.getHttpServer().address().port;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  const openStream = (path: string, headers: Record<string, string> = {}) =>
    new Promise<{ status: number; chunks: string[]; close: () => void }>((resolve, reject) => {
      const chunks: string[] = [];
      const req = httpRequest({ port, path, headers }, (res) => {
        res.setEncoding('utf8');
        res.on('data', (d) => chunks.push(d));
        resolve({ status: res.statusCode ?? 0, chunks, close: () => req.destroy() });
      });
      req.on('error', (e) => (e as NodeJS.ErrnoException).code === 'ECONNRESET' ? undefined : reject(e));
      req.end();
    });

  it('searches title, description and comments within the workspace only', async () => {
    const byTitle = (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'zebra-title' }).expect(201)).body;
    const byDesc = (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'b', descriptionMd: 'has zebra-desc inside' }).expect(201)).body;
    const byComment = (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'c' }).expect(201)).body;
    await ctx.http().post(`/tasks/${byComment.id}/comments`).set(auth(owner)).send({ bodyMd: 'a zebra-comment here' }).expect(201);
    for (const [q, id] of [['zebra-title', byTitle.id], ['zebra-desc', byDesc.id], ['zebra-comment', byComment.id]]) {
      const res = await ctx.http().get(`/search?q=${q}`).set(auth(owner)).expect(200);
      expect(res.body.tasks.map((t: { id: string }) => t.id)).toContain(id);
    }
    const leak = await ctx.http().get('/search?q=zebra').set(auth(outsider)).expect(200);
    expect(leak.body.tasks).toHaveLength(0);
    expect(leak.body.comments).toHaveLength(0);
    const regexChars = await ctx.http().get('/search?q=.*').set(auth(owner)).expect(200);
    expect(regexChars.body.tasks).toHaveLength(0);
    await ctx.http().get('/search?q=').set(auth(owner)).expect(400);
  });

  it('streams only own-workspace events over SSE using a session token in the query', async () => {
    const own = await openStream(`/events?access_token=${owner.token}`);
    const foreign = await openStream(`/events?access_token=${outsider.token}`);
    expect(own.status).toBe(200);
    const t = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'streamed' }).expect(201);
    await new Promise((r) => setTimeout(r, 300));
    expect(own.chunks.join('')).toContain(t.body.id);
    expect(foreign.chunks.join('')).not.toContain(t.body.id);
    own.close();
    foreign.close();
  });

  it('rejects missing, invalid and API tokens on the SSE query and the query token on other routes', async () => {
    const none = await openStream('/events');
    expect(none.status).toBe(401);
    const bad = await openStream('/events?access_token=junk');
    expect(bad.status).toBe(401);
    const tok = await ctx.http().post('/api-tokens').set(auth(owner)).send({ name: 'x', scopes: ['tasks:read'] }).expect(201);
    const api = await openStream(`/events?access_token=${tok.body.token}`);
    expect(api.status).toBe(401);
    await ctx.http().get(`/tasks?access_token=${owner.token}`).expect(401);
  });
});
