import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('Auth, users and tokens (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let admin: { token: string; id: string };
  let member: { token: string; id: string };

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    admin = await ctx.login('admin@acme.test', 'Admin', 'admin');
    member = await ctx.login('member@acme.test', 'Member');
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('first user becomes owner, the next ones join as member even asking for admin', async () => {
    const me = await ctx.http().get('/auth/me').set('Authorization', `Bearer ${owner.token}`).expect(200);
    expect(me.body.role).toBe('owner');
    const adminMe = await ctx.http().get('/auth/me').set('Authorization', `Bearer ${admin.token}`).expect(200);
    expect(adminMe.body.role).toBe('admin');
  });

  it('rejects missing and invalid sessions', async () => {
    await ctx.http().get('/auth/me').expect(401);
    await ctx.http().get('/auth/me').set('Authorization', 'Bearer nope').expect(401);
  });

  it('access login accepts the allowed domain and refuses other domains, unverified emails and missing assertions', async () => {
    const ok = await ctx.http().post('/auth/access').set('Cf-Access-Jwt-Assertion', 'new.person@acme.test|New Person|verified').expect(200);
    expect(ok.body.user.role).toBe('member');
    expect(ok.body.accessToken).toEqual(expect.any(String));
    const again = await ctx.http().post('/auth/access').set('Cf-Access-Jwt-Assertion', 'new.person@acme.test|New Person|verified').expect(200);
    expect(again.body.user.id).toBe(ok.body.user.id);
    const viaCookie = await ctx
      .http()
      .post('/auth/access')
      .set('Cookie', `other=1; CF_Authorization=${encodeURIComponent('new.person@acme.test|New Person|verified')}`)
      .expect(200);
    expect(viaCookie.body.user.id).toBe(ok.body.user.id);
    await ctx.http().post('/auth/access').set('Cookie', 'CF_AuthorizationX=new.person@acme.test|x|verified').expect(401);
    await ctx.http().post('/auth/access').set('Cf-Access-Jwt-Assertion', 'evil@gmail.com|Evil|verified').expect(403);
    await ctx.http().post('/auth/access').set('Cookie', 'CF_Authorization=evil@gmail.com|Evil|verified').expect(403);
    await ctx.http().post('/auth/access').set('Cf-Access-Jwt-Assertion', 'other@acme.test|Other|unverified').expect(403);
    await ctx.http().post('/auth/access').expect(401);
    await ctx.http().post('/auth/access').set('Cf-Access-Jwt-Assertion', '').expect(401);
    await ctx.http().post('/auth/google').send({ idToken: 'new.person@acme.test|New Person|verified' }).expect(404);
  });

  it('member cannot manage roles, owner can, admin cannot', async () => {
    await ctx.http().patch(`/users/${member.id}/role`).set('Authorization', `Bearer ${member.token}`).send({ role: 'admin' }).expect(403);
    await ctx.http().patch(`/users/${member.id}/role`).set('Authorization', `Bearer ${admin.token}`).send({ role: 'admin' }).expect(403);
    const res = await ctx.http().patch(`/users/${member.id}/role`).set('Authorization', `Bearer ${owner.token}`).send({ role: 'admin' }).expect(200);
    expect(res.body.role).toBe('admin');
    await ctx.http().patch(`/users/${member.id}/role`).set('Authorization', `Bearer ${owner.token}`).send({ role: 'member' }).expect(200);
    await ctx.http().patch(`/users/${member.id}/role`).set('Authorization', `Bearer ${owner.token}`).send({ role: 'god' }).expect(400);
  });

  it('last owner cannot be demoted', async () => {
    await ctx.http().patch(`/users/${owner.id}/role`).set('Authorization', `Bearer ${owner.token}`).send({ role: 'member' }).expect(400);
  });

  it('disabled users lose access immediately', async () => {
    const temp = await ctx.login('temp@acme.test');
    await ctx.http().patch(`/users/${temp.id}/status`).set('Authorization', `Bearer ${owner.token}`).send({ status: 'disabled' }).expect(200);
    await ctx.http().get('/auth/me').set('Authorization', `Bearer ${temp.token}`).expect(401);
    await ctx.http().patch(`/users/${owner.id}/status`).set('Authorization', `Bearer ${owner.token}`).send({ status: 'disabled' }).expect(400);
  });

  it('users from another workspace are isolated', async () => {
    const outsider = await ctx.login('outsider@acme.test', 'Outsider', undefined, 'other');
    const list = await ctx.http().get('/users').set('Authorization', `Bearer ${outsider.token}`).expect(200);
    expect(list.body.map((u: { email: string }) => u.email)).toEqual(['outsider@acme.test']);
    await ctx.http().patch(`/users/${member.id}/role`).set('Authorization', `Bearer ${outsider.token}`).send({ role: 'admin' }).expect(404);
  });

  it('api tokens: scope subset, plaintext once, scope enforcement, revoke, audit', async () => {
    await ctx
      .http()
      .post('/api-tokens')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ name: 'x', scopes: ['tasks:read'] })
      .expect(403);
    await ctx
      .http()
      .post('/api-tokens')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'x', scopes: ['users:manage'] })
      .expect(403);
    await ctx
      .http()
      .post('/api-tokens')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'x', scopes: ['bogus'] })
      .expect(400);
    const created = await ctx
      .http()
      .post('/api-tokens')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ name: 'poller', scopes: ['users:read'] })
      .expect(201);
    expect(created.body.token).toMatch(/^orb_/);
    const raw = created.body.token as string;
    await ctx.http().get('/users').set('Authorization', raw).expect(200);
    await ctx.http().get('/users').set('Authorization', `Bearer ${raw}`).expect(200);
    await ctx.http().patch(`/users/${member.id}/role`).set('Authorization', raw).send({ role: 'admin' }).expect(403);
    await ctx
      .http()
      .post('/api-tokens')
      .set('Authorization', raw)
      .send({ name: 'y', scopes: ['users:read'] })
      .expect(403);
    const list = await ctx.http().get('/api-tokens').set('Authorization', `Bearer ${owner.token}`).expect(200);
    expect(JSON.stringify(list.body)).not.toContain(raw);
    await ctx.http().delete(`/api-tokens/${created.body.id}`).set('Authorization', `Bearer ${owner.token}`).expect(204);
    await ctx.http().get('/users').set('Authorization', raw).expect(401);
    await ctx.http().delete(`/api-tokens/${created.body.id}`).set('Authorization', `Bearer ${owner.token}`).expect(400);
  });

  it('a guest reads its own session but stays out of member routes', async () => {
    const guest = await ctx.login('guest@acme.test', 'Guest', 'guest');
    const me = await ctx.http().get('/auth/me').set('Authorization', `Bearer ${guest.token}`).expect(200);
    expect(me.body.role).toBe('guest');
    await ctx.http().get('/users').set('Authorization', `Bearer ${guest.token}`).expect(403);
    await ctx.http().get('/api-tokens').set('Authorization', `Bearer ${guest.token}`).expect(403);
  });

  it('an admin sees and revokes only its own tokens, the owner sees and revokes all', async () => {
    const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
    const otherAdmin = await ctx.login('admin2@acme.test', 'Admin 2', 'admin');
    const first = await ctx
      .http()
      .post('/api-tokens')
      .set(auth(admin))
      .send({ name: 'do admin', scopes: ['tasks:read'] })
      .expect(201);
    const second = await ctx
      .http()
      .post('/api-tokens')
      .set(auth(otherAdmin))
      .send({ name: 'do outro', scopes: ['tasks:read'] })
      .expect(201);
    const firstList = await ctx.http().get('/api-tokens').set(auth(admin)).expect(200);
    const firstIds = firstList.body.map((t: { id: string }) => t.id);
    expect(firstIds).toContain(first.body.id);
    expect(firstIds).not.toContain(second.body.id);
    expect(firstList.body.every((t: { userId: string }) => t.userId === admin.id)).toBe(true);
    await ctx.http().delete(`/api-tokens/${second.body.id}`).set(auth(admin)).expect(404);
    await ctx.http().get('/users').set('Authorization', second.body.token).expect(403);
    await ctx.http().get('/tasks').set('Authorization', second.body.token).expect(200);
    const ownerIds = (await ctx.http().get('/api-tokens').set(auth(owner)).expect(200)).body.map((t: { id: string }) => t.id);
    expect(ownerIds).toEqual(expect.arrayContaining([first.body.id, second.body.id]));
    await ctx.http().delete(`/api-tokens/${second.body.id}`).set(auth(owner)).expect(204);
    await ctx.http().get('/tasks').set('Authorization', second.body.token).expect(401);
    await ctx.http().delete(`/api-tokens/${first.body.id}`).set(auth(admin)).expect(204);
    await ctx.http().get('/api-tokens').set(auth(member)).expect(403);
  });

  it('dev login answers 404 before validating the body when disabled, and validates only when enabled', async () => {
    process.env.ENABLE_DEV_LOGIN = 'false';
    try {
      for (const body of [undefined, {}, { email: 'nao-e-email' }, { email: 'z@acme.test', name: 'Z', extra: 1 }, { email: 'z@acme.test', name: 'Z' }]) {
        const res = await ctx.http().post('/auth/dev-login').send(body);
        expect(res.status).toBe(404);
        expect(JSON.stringify(res.body)).not.toMatch(/email|name|should/i);
        expect(res.headers['set-cookie']).toBeUndefined();
      }
      expect(await ctx.app.get<Connection>(getConnectionToken()).collection('users').countDocuments({ email: 'z@acme.test' })).toBe(0);
    } finally {
      process.env.ENABLE_DEV_LOGIN = 'true';
    }
    const invalid = await ctx.http().post('/auth/dev-login').send({ email: 'nao-e-email' }).expect(400);
    expect(JSON.stringify(invalid.body.message)).toMatch(/email/);
  });
});
