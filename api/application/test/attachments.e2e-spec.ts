import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('Attachments (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let member: { token: string; id: string };
  let outsider: { token: string; id: string };
  let taskId: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    member = await ctx.login('member@acme.test', 'Member');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    const list = await ctx.http().post(`/spaces/${tree.body[0].id}/lists`).set(auth(owner)).send({ name: 'L' }).expect(201);
    taskId = (await ctx.http().post(`/lists/${list.body.id}/tasks`).set(auth(owner)).send({ title: 'T' }).expect(201)).body.id;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  const request = (who: { token: string }, size = 10, name = 'report final.pdf') => ctx.http().post(`/tasks/${taskId}/attachments`).set(auth(who)).send({ filename: name, mimeType: 'application/pdf', sizeBytes: size });

  it('issues a presigned upload, confirms after the object exists, then serves a short-lived download', async () => {
    const req = await request(member).expect(201);
    expect(req.body.uploadUrl).toContain('/upload/');
    expect(req.body.uploadUrl).not.toContain(' ');
    expect(req.body.confirmed).toBe(false);
    await ctx.http().get(`/attachments/${req.body.id}/download`).set(auth(member)).expect(404);
    await ctx.http().post(`/attachments/${req.body.id}/confirm`).set(auth(member)).expect(400);
    const key = req.body.uploadUrl.split('/upload/')[1].split('?')[0];
    ctx.storage.objects.set(key, 10);
    const ok = await ctx.http().post(`/attachments/${req.body.id}/confirm`).set(auth(member)).expect(200);
    expect(ok.body.confirmed).toBe(true);
    const dl = await ctx.http().get(`/attachments/${req.body.id}/download`).set(auth(owner)).expect(200);
    expect(dl.body.expiresInSeconds).toBeLessThanOrEqual(300);
    expect(dl.body.url).toContain('/download/');
    const list = await ctx.http().get(`/tasks/${taskId}/attachments`).set(auth(owner)).expect(200);
    expect(list.body.map((a: { id: string }) => a.id)).toContain(req.body.id);
  });

  it('rejects size mismatch, oversize and invalid input', async () => {
    const req = await request(member, 10).expect(201);
    const key = req.body.uploadUrl.split('/upload/')[1].split('?')[0];
    ctx.storage.objects.set(key, 999);
    await ctx.http().post(`/attachments/${req.body.id}/confirm`).set(auth(member)).expect(400);
    expect(ctx.storage.objects.has(key)).toBe(false);
    await request(member, 52428801).expect(400);
    await request(member, 0).expect(400);
  });

  it('sanitizes the storage key and namespaces it by workspace and task', async () => {
    const req = await request(member, 5, '../../etc/passwd').expect(201);
    const key = req.body.uploadUrl.split('/upload/')[1].split('?')[0];
    expect(key).not.toContain('..');
    expect(key.split('/')).toHaveLength(3);
  });

  it('blocks IDOR across workspaces and other uploaders', async () => {
    const req = await request(member).expect(201);
    const key = req.body.uploadUrl.split('/upload/')[1].split('?')[0];
    ctx.storage.objects.set(key, 10);
    await ctx.http().post(`/attachments/${req.body.id}/confirm`).set(auth(owner)).expect(404);
    await ctx.http().post(`/attachments/${req.body.id}/confirm`).set(auth(outsider)).expect(404);
    await ctx.http().post(`/attachments/${req.body.id}/confirm`).set(auth(member)).expect(200);
    await ctx.http().get(`/attachments/${req.body.id}/download`).set(auth(outsider)).expect(404);
    await request(outsider).expect(404);
    await ctx.http().delete(`/attachments/${req.body.id}`).set(auth(outsider)).expect(404);
    await ctx.http().delete(`/attachments/${req.body.id}`).set(auth(owner)).expect(204);
    expect(ctx.storage.objects.has(key)).toBe(false);
  });

  it('API token without attachments scope cannot request uploads', async () => {
    const tok = await ctx.http().post('/api-tokens').set(auth(owner)).send({ name: 'ro', scopes: ['tasks:read'] }).expect(201);
    await ctx.http().post(`/tasks/${taskId}/attachments`).set({ Authorization: tok.body.token }).send({ filename: 'a', mimeType: 'text/plain', sizeBytes: 1 }).expect(403);
  });
});
