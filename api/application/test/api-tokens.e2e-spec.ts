import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';
import { USER_INJECT_TOKEN } from '../src/domain/constants/inject-token.constant';
import { UserRepository } from '../src/domain/repositories/user.repository';

describe('API tokens: shown once, never above the owner role, revoke wins over use (e2e)', () => {
  let ctx: TestContext;
  let db: Connection;
  let owner: { token: string; id: string };
  let admin: { token: string; id: string };
  let spaceId: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
  const issue = async (who: { token: string }, scopes: string[], name = 'token de teste') => {
    const res = await ctx.http().post('/api-tokens').set(auth(who)).send({ name, scopes }).expect(201);
    return { id: res.body.id as string, raw: res.body.token as string };
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    db = ctx.app.get<Connection>(getConnectionToken());
    owner = await ctx.login('owner@tokens.test', 'Owner');
    admin = await ctx.login('admin@tokens.test', 'Admin', 'admin');
    spaceId = (await ctx.http().get('/hierarchy').set(auth(owner)).expect(200)).body[0].id;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('returns the plain token only in the creation response and never stores or logs it', async () => {
    const { id, raw } = await issue(admin, ['tasks:read']);
    expect(raw).toMatch(/^orb_/);
    const listed = await ctx.http().get('/api-tokens').set(auth(admin)).expect(200);
    const row = listed.body.find((t: { id: string }) => t.id === id);
    expect(row).toBeDefined();
    expect(JSON.stringify(listed.body)).not.toContain(raw);
    expect(Object.keys(row)).not.toEqual(expect.arrayContaining(['token']));
    expect(JSON.stringify((await ctx.http().get('/api-tokens').set(auth(owner)).expect(200)).body)).not.toContain(raw);
    const stored = await db.collection('api_tokens').findOne({ _id: id as never });
    expect(stored).not.toBeNull();
    expect(JSON.stringify(stored)).not.toContain(raw);
    expect(stored?.token_hash).toMatch(/^[0-9a-f]{64}$/);
    const audits = await db.collection('audit_logs').find({ entity_id: id }).toArray();
    expect(audits.length).toBeGreaterThan(0);
    expect(JSON.stringify(audits)).not.toContain(raw);
  });

  it('refuses a token asking for more than the creator holds', async () => {
    await ctx
      .http()
      .post('/api-tokens')
      .set(auth(admin))
      .send({ name: 'x', scopes: ['users:manage'] })
      .expect(403);
    const { raw } = await issue(admin, ['tasks:read']);
    await ctx
      .http()
      .post('/api-tokens')
      .set({ Authorization: raw })
      .send({ name: 'y', scopes: ['tasks:read'] })
      .expect(403);
  });

  it('never grants more than the owner current role: a demoted admin token loses structure writes at once', async () => {
    const demoted = await ctx.login('demoted@tokens.test', 'Demoted', 'admin');
    const { raw } = await issue(demoted, ['workspace:read', 'structure:write', 'tasks:read', 'tasks:write']);
    await ctx.http().post(`/spaces/${spaceId}/lists`).set({ Authorization: raw }).send({ name: 'Pelo token admin' }).expect(201);
    await ctx.http().patch(`/users/${demoted.id}/role`).set(auth(owner)).send({ role: 'member' }).expect(200);
    await ctx.http().post(`/spaces/${spaceId}/lists`).set({ Authorization: raw }).send({ name: 'Depois de rebaixado' }).expect(403);
    await ctx.http().get('/tasks').set({ Authorization: raw }).expect(200);
  });

  it('answers 401 while the token owner is disabled', async () => {
    const person = await ctx.login('disabled@tokens.test', 'Disabled', 'admin');
    const { raw } = await issue(person, ['tasks:read']);
    await ctx.http().get('/tasks').set({ Authorization: raw }).expect(200);
    await ctx.http().patch(`/users/${person.id}/status`).set(auth(owner)).send({ status: 'disabled' }).expect(200);
    await ctx.http().get('/tasks').set({ Authorization: raw }).expect(401);
  });

  it('keeps a token revoked when the revoke lands in the middle of a request that already read it', async () => {
    const { id, raw } = await issue(admin, ['tasks:read']);
    const users = ctx.app.get<UserRepository>(USER_INJECT_TOKEN);
    const original = users.findByIdInWorkspace.bind(users);
    const spy = jest.spyOn(users, 'findByIdInWorkspace').mockImplementationOnce(async (userId: string, workspaceId: string) => {
      await ctx.http().delete(`/api-tokens/${id}`).set(auth(admin)).expect(204);
      return original(userId, workspaceId);
    });
    await ctx.http().get('/tasks').set({ Authorization: raw }).expect(401);
    spy.mockRestore();
    const stored = await db.collection('api_tokens').findOne({ _id: id as never });
    expect(stored?.revoked_at).toBeInstanceOf(Date);
    await ctx.http().get('/tasks').set({ Authorization: raw }).expect(401);
  });

  it('holds the revoke against 32 parallel uses of the same token', async () => {
    for (let round = 0; round < 3; round += 1) {
      const { id, raw } = await issue(admin, ['tasks:read'], `paralelo ${round}`);
      const uses = Array.from({ length: 32 }, () => ctx.http().get('/tasks').set({ Authorization: raw }));
      const [revoke, ...results] = await Promise.all([ctx.http().delete(`/api-tokens/${id}`).set(auth(admin)), ...uses]);
      expect(revoke.status).toBe(204);
      expect(results.every(r => r.status === 200 || r.status === 401)).toBe(true);
      const stored = await db.collection('api_tokens').findOne({ _id: id as never });
      expect(stored?.revoked_at).toBeInstanceOf(Date);
      const after = await Promise.all(Array.from({ length: 32 }, () => ctx.http().get('/tasks').set({ Authorization: raw })));
      expect(after.map(r => r.status)).toEqual(Array.from({ length: 32 }, () => 401));
    }
  });

  it('revokes once when 32 revokes of the same token race, with a single audit entry', async () => {
    const { id, raw } = await issue(owner, ['tasks:read'], 'revogação em corrida');
    const results = await Promise.all(Array.from({ length: 32 }, () => ctx.http().delete(`/api-tokens/${id}`).set(auth(owner))));
    const statuses = results.map(r => r.status);
    expect(statuses.filter(s => s === 204)).toHaveLength(1);
    expect(statuses.filter(s => s === 400)).toHaveLength(31);
    expect(await db.collection('audit_logs').countDocuments({ action: 'token.revoked', entity_id: id })).toBe(1);
    await ctx.http().get('/tasks').set({ Authorization: raw }).expect(401);
  });
});
