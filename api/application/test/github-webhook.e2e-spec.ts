import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('GitHub webhook (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let taskId: string;
  let deliveryCounter = 0;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
  const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures/github', name), 'utf8').split('__TASK__').join(taskId);
  const sign = (body: string, secret = 'whsec-test') => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  const send = (body: string, opts: { delivery?: string; event?: string; signature?: string } = {}) =>
    ctx.http().post('/webhooks/github').set('Content-Type', 'application/json').set('X-GitHub-Event', opts.event ?? 'pull_request').set('X-GitHub-Delivery', opts.delivery ?? `d-${++deliveryCounter}`).set('X-Hub-Signature-256', opts.signature ?? sign(body)).send(body);
  const task = async () => (await ctx.http().get(`/tasks/${taskId}`).set(auth(owner)).expect(200)).body;
  const comments = async () => (await ctx.http().get(`/tasks/${taskId}/comments`).set(auth(owner)).expect(200)).body;

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    const list = await ctx.http().post(`/spaces/${tree.body[0].id}/lists`).set(auth(owner)).send({ name: 'L' }).expect(201);
    taskId = (await ctx.http().post(`/lists/${list.body.id}/tasks`).set(auth(owner)).send({ title: 'T', status: 'in development' }).expect(201)).body.id;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('rejects a missing, wrong or tampered signature and changes nothing', async () => {
    const body = fixture('pr-opened.json');
    await ctx.http().post('/webhooks/github').set('Content-Type', 'application/json').set('X-GitHub-Event', 'pull_request').set('X-GitHub-Delivery', 'x1').send(body).expect(401);
    await send(body, { signature: sign(body, 'wrong') }).expect(401);
    await send(body, { signature: 'sha256=zz' }).expect(401);
    await send(body, { signature: sign(body + ' ') }).expect(401);
    expect((await task()).status).toBe('in development');
  });

  it('PR opened with the task id in the title moves the task to In review', async () => {
    const res = await send(fixture('pr-opened.json')).expect(200);
    expect(res.body).toEqual({ status: 'processed', linked: [taskId] });
    expect((await task()).status).toBe('in review');
  });

  it('replaying the same delivery id is idempotent', async () => {
    const body = fixture('pr-merged.json');
    const first = await send(body, { delivery: 'merge-1' }).expect(200);
    expect(first.body.status).toBe('processed');
    const before = (await comments()).length;
    const replay = await send(body, { delivery: 'merge-1' }).expect(200);
    expect(replay.body.status).toBe('duplicate');
    expect((await comments()).length).toBe(before);
    const merged = (await comments()).filter((c: { bodyMd: string }) => c.bodyMd.startsWith('Merged into homolog on '));
    expect(merged).toHaveLength(1);
    expect(merged[0].bodyMd).toMatch(/^Merged into homolog on \d{4}-\d{2}-\d{2} \(https:\/\/github\.com\/org\/acme-bet\/pull\/101\)$/);
  });

  it('concurrent deliveries of the same id are processed once', async () => {
    const body = fixture('pr-opened-branch.json');
    const results = await Promise.all([1, 2, 3, 4].map(() => send(body, { delivery: 'race-1' })));
    results.forEach((r) => expect(r.status).toBe(200));
    expect(results.filter((r) => r.body.status === 'processed')).toHaveLength(1);
  });

  it('links via the branch name, ignores unrelated PRs, unknown events and closed-unmerged', async () => {
    expect((await send(fixture('pr-unrelated.json')).expect(200)).body).toEqual({ status: 'processed', linked: [] });
    expect((await send(fixture('pr-closed.json')).expect(200)).body.status).toBe('processed');
    expect((await send('{}', { event: 'ping' }).expect(200)).body.status).toBe('ignored');
    const before = (await comments()).length;
    await send(fixture('pr-closed.json'), { delivery: 'closed-2' }).expect(200);
    expect((await comments()).length).toBe(before);
  });

  it('does not reopen a closed task when a PR is opened for it', async () => {
    const tree = await ctx.http().get('/hierarchy').set(auth(owner));
    const list = await ctx.http().post(`/spaces/${tree.body[0].id}/lists`).set(auth(owner)).send({ name: 'L2' });
    const done = (await ctx.http().post(`/lists/${list.body.id}/tasks`).set(auth(owner)).send({ title: 'done', status: 'completed' }).expect(201)).body.id;
    const body = fixture('pr-opened.json').split(taskId).join(done);
    await send(body).expect(200);
    expect((await ctx.http().get(`/tasks/${done}`).set(auth(owner))).body.status).toBe('completed');
  });
});
