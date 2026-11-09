import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('Comments and notifications (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let member: { token: string; id: string };
  let other: { token: string; id: string };
  let outsider: { token: string; id: string };
  let taskId: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    member = await ctx.login('member@acme.test', 'Member');
    other = await ctx.login('other@acme.test', 'Other');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    const list = await ctx.http().post(`/spaces/${tree.body[0].id}/lists`).set(auth(owner)).send({ name: 'L' }).expect(201);
    const task = await ctx.http().post(`/lists/${list.body.id}/tasks`).set(auth(owner)).send({ title: 'T' }).expect(201);
    taskId = task.body.id;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('creates, lists and edits a comment; only the author edits; markdown stored raw', async () => {
    const xss = '<script>alert(1)</script> **bold**';
    const c = await ctx.http().post(`/tasks/${taskId}/comments`).set(auth(member)).send({ bodyMd: xss }).expect(201);
    expect(c.body.bodyMd).toBe(xss);
    await ctx.http().patch(`/comments/${c.body.id}`).set(auth(other)).send({ bodyMd: 'hijack' }).expect(403);
    const edited = await ctx.http().patch(`/comments/${c.body.id}`).set(auth(member)).send({ bodyMd: 'edited' }).expect(200);
    expect(edited.body.editedAt).not.toBeNull();
    const list = await ctx.http().get(`/tasks/${taskId}/comments`).set(auth(owner)).expect(200);
    expect(list.body.map((x: { bodyMd: string }) => x.bodyMd)).toContain('edited');
    await ctx.http().post(`/tasks/${taskId}/comments`).set(auth(member)).send({ bodyMd: '   ' }).expect(400);
  });

  it('mentions create notifications that only the recipient sees and can mark read', async () => {
    await ctx.http().post(`/tasks/${taskId}/comments`).set(auth(member)).send({ bodyMd: 'hey', mentionIds: [other.id] }).expect(201);
    await ctx.http().post(`/tasks/${taskId}/comments`).set(auth(member)).send({ bodyMd: 'self', mentionIds: [member.id] }).expect(201);
    await ctx.http().post(`/tasks/${taskId}/comments`).set(auth(member)).send({ bodyMd: 'ghost', mentionIds: ['nobody'] }).expect(400);
    const mine = await ctx.http().get('/notifications?unread=true').set(auth(other)).expect(200);
    expect(mine.body.unread).toBe(1);
    expect(mine.body.data[0].type).toBe('mention');
    const memberView = await ctx.http().get('/notifications').set(auth(member)).expect(200);
    expect(memberView.body.data.filter((n: { type: string }) => n.type === 'mention')).toHaveLength(0);
    await ctx.http().post('/notifications/read').set(auth(member)).send({ ids: [mine.body.data[0].id] }).expect(204);
    expect((await ctx.http().get('/notifications').set(auth(other))).body.unread).toBe(1);
    await ctx.http().post('/notifications/read').set(auth(other)).send({}).expect(204);
    expect((await ctx.http().get('/notifications').set(auth(other))).body.unread).toBe(0);
  });

  it('creates assignment and status change notifications', async () => {
    const tree = await ctx.http().get('/hierarchy').set(auth(owner));
    const list = await ctx.http().post(`/spaces/${tree.body[0].id}/lists`).set(auth(owner)).send({ name: 'N' });
    const t = await ctx.http().post(`/lists/${list.body.id}/tasks`).set(auth(owner)).send({ title: 'assign', assigneeIds: [other.id] }).expect(201);
    await ctx.http().patch(`/tasks/${t.body.id}`).set(auth(owner)).send({ status: 'in review' }).expect(200);
    const types = (await ctx.http().get('/notifications').set(auth(other))).body.data.map((n: { type: string }) => n.type);
    expect(types).toEqual(expect.arrayContaining(['assignment', 'status_change']));
  });

  it('keeps one daily log comment per author per day, edited in place', async () => {
    const a = await ctx.http().put(`/tasks/${taskId}/daily-log`).set(auth(member)).send({ bodyMd: 'v1' }).expect(200);
    const b = await ctx.http().put(`/tasks/${taskId}/daily-log`).set(auth(member)).send({ bodyMd: 'v2' }).expect(200);
    expect(b.body.id).toBe(a.body.id);
    expect(b.body.bodyMd).toBe('v2');
    expect(b.body.dailyLogDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const c = await ctx.http().put(`/tasks/${taskId}/daily-log`).set(auth(other)).send({ bodyMd: 'mine' }).expect(200);
    expect(c.body.id).not.toBe(a.body.id);
    const logs = (await ctx.http().get(`/tasks/${taskId}/comments`).set(auth(owner))).body.filter((x: { dailyLogDate: string | null }) => x.dailyLogDate);
    expect(logs).toHaveLength(2);
  });

  it('isolates comments across workspaces and restricts deletes', async () => {
    const c = await ctx.http().post(`/tasks/${taskId}/comments`).set(auth(member)).send({ bodyMd: 'private' }).expect(201);
    await ctx.http().get(`/tasks/${taskId}/comments`).set(auth(outsider)).expect(404);
    await ctx.http().post(`/tasks/${taskId}/comments`).set(auth(outsider)).send({ bodyMd: 'x' }).expect(404);
    await ctx.http().patch(`/comments/${c.body.id}`).set(auth(outsider)).send({ bodyMd: 'x' }).expect(404);
    await ctx.http().delete(`/comments/${c.body.id}`).set(auth(outsider)).expect(404);
    await ctx.http().delete(`/comments/${c.body.id}`).set(auth(other)).expect(403);
    await ctx.http().delete(`/comments/${c.body.id}`).set(auth(owner)).expect(204);
  });
});
