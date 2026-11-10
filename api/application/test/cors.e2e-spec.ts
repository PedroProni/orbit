import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';
import { CorsService } from '../src/infrastructure/http-security/services/cors.service';

const PUBLIC_URL = 'https://orbit-demo.proni.dev';
const PROD_URL = 'https://orbit-board.proni.dev';
const EVIL = 'https://evil.example';

describe('CORS: unknown origins get a 403 JSON before the route, the public URL and server calls keep working (e2e)', () => {
  let ctx: TestContext;
  let db: Connection;
  let owner: { token: string; id: string };
  const previous = { local: process.env.LOCAL_DOMAIN, prod: process.env.PROD_DOMAIN };

  beforeAll(async () => {
    process.env.LOCAL_DOMAIN = `${PUBLIC_URL}/`;
    process.env.PROD_DOMAIN = PROD_URL;
    ctx = await createTestApp(app => app.get(CorsService).setCors(app));
    db = ctx.app.get<Connection>(getConnectionToken());
    owner = await ctx.login('dona@acme.test', 'Dona');
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
    for (const [key, value] of [
      ['LOCAL_DOMAIN', previous.local],
      ['PROD_DOMAIN', previous.prod],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const isRefusal = (res: { status: number; body: unknown; headers: Record<string, unknown> }) => {
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ statusCode: 403, message: 'CORS_ORIGIN_NOT_ALLOWED', error: 'Forbidden' });
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers['set-cookie']).toBeUndefined();
  };

  it('answers 403 JSON to an unknown origin on preflight, login and reads, and the route never runs', async () => {
    isRefusal(await ctx.http().options('/auth/dev-login').set('Origin', EVIL).set('Access-Control-Request-Method', 'POST').set('Access-Control-Request-Headers', 'content-type'));
    const users = await db.collection('users').countDocuments({});
    const sessions = await db.collection('auth_sessions').countDocuments({});
    isRefusal(await ctx.http().post('/auth/dev-login').set('Origin', EVIL).send({ email: 'intrusa@acme.test', name: 'Intrusa' }));
    isRefusal(await ctx.http().post('/auth/login').set('Origin', EVIL).send({ email: 'dona@acme.test', password: 'qualquer-senha-longa' }));
    isRefusal(await ctx.http().get('/auth/me').set('Origin', EVIL).set('Authorization', `Bearer ${owner.token}`));
    isRefusal(await ctx.http().post('/auth/dev-login').set('Origin', 'null').send({ email: 'intrusa@acme.test', name: 'Intrusa' }));
    isRefusal(await ctx.http().post('/auth/dev-login').set('Origin', `${PUBLIC_URL}.evil.example`).send({ email: 'intrusa@acme.test', name: 'Intrusa' }));
    expect(await db.collection('users').countDocuments({})).toBe(users);
    expect(await db.collection('auth_sessions').countDocuments({})).toBe(sessions);
    expect(await db.collection('users').countDocuments({ email: 'intrusa@acme.test' })).toBe(0);
  });

  it('lets a request whose Origin is the configured public URL (LOCAL_DOMAIN) through, with the CSRF header allowed', async () => {
    const preflight = await ctx.http().options('/tasks').set('Origin', PUBLIC_URL).set('Access-Control-Request-Method', 'POST').set('Access-Control-Request-Headers', 'content-type,x-orbit-csrf');
    expect(preflight.status).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe(PUBLIC_URL);
    expect(preflight.headers['access-control-allow-credentials']).toBe('true');
    expect(String(preflight.headers['access-control-allow-headers']).toLowerCase()).toContain('x-orbit-csrf');
    const login = await ctx.http().post('/auth/dev-login').set('Origin', PUBLIC_URL).send({ email: 'demo@acme.test', name: 'Demo' }).expect(200);
    expect(login.headers['access-control-allow-origin']).toBe(PUBLIC_URL);
    const cookie = ([] as string[])
      .concat(login.headers['set-cookie'] ?? [])
      .find(value => value.startsWith('orbit_session=') && !value.startsWith('orbit_session=;'))!
      .split(';')[0];
    const me = await ctx.http().get('/auth/me').set('Origin', PUBLIC_URL).set('Cookie', cookie).expect(200);
    expect(me.body.email).toBe('demo@acme.test');
    const space = (await ctx.http().get('/hierarchy').set('Origin', PUBLIC_URL).set('Cookie', cookie).expect(200)).body[0];
    const list = await ctx.http().post(`/spaces/${space.id}/lists`).set('Authorization', `Bearer ${owner.token}`).send({ name: 'Lista do demo' }).expect(201);
    const refused = await ctx.http().post(`/lists/${list.body.id}/tasks`).set('Origin', PUBLIC_URL).set('Cookie', cookie).send({ title: 'Sem CSRF' }).expect(403);
    expect(refused.body.message).toBe('CSRF_HEADER_REQUIRED');
    const task = await ctx.http().post(`/lists/${list.body.id}/tasks`).set('Origin', PUBLIC_URL).set('Cookie', cookie).set('x-orbit-csrf', '1').send({ title: 'Pelo demo' }).expect(201);
    expect(task.headers['access-control-allow-origin']).toBe(PUBLIC_URL);
    expect(task.body.title).toBe('Pelo demo');
    await ctx.http().get('/auth/me').set('Origin', PROD_URL).set('Authorization', `Bearer ${owner.token}`).expect(200);
  });

  it('keeps requests with no Origin (server-side proxy calls) working, without CORS headers', async () => {
    const login = await ctx.http().post('/auth/dev-login').send({ email: 'proxy@acme.test', name: 'Proxy' }).expect(200);
    expect(login.headers['access-control-allow-origin']).toBeUndefined();
    const me = await ctx.http().get('/auth/me').set('Authorization', `Bearer ${owner.token}`).expect(200);
    expect(me.body.email).toBe('dona@acme.test');
    await ctx.http().get('/hierarchy').set('Authorization', `Bearer ${login.body.accessToken}`).expect(200);
  });
});
