import { createHash } from 'node:crypto';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';
import { bootstrapOwner } from '../src/cli/access/owner-bootstrap.runner';
import { DEFAULT_STATUSES } from '../src/domain/constants/default-statuses.constant';

const PASSWORD = 'uma-senha-bem-longa-1';
const BASE_URL = 'https://orbit.test/';
const COLLECTIONS = ['users', 'workspaces', 'spaces', 'auth_tokens', 'auth_sessions', 'user_credentials', 'audit_logs', 'system_markers', 'login_attempts'];

describe('Owner bootstrap command (e2e)', () => {
  let ctx: TestContext;
  let db: Connection;

  const counts = async () => {
    const entries = await Promise.all(COLLECTIONS.map(async name => [name, await db.collection(name).countDocuments({})] as const));
    return Object.fromEntries(entries);
  };
  const tokenOf = (link: string) => link.split('#token=')[1];

  beforeAll(async () => {
    ctx = await createTestApp();
    db = ctx.app.get<Connection>(getConnectionToken());
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    await Promise.all(COLLECTIONS.map(name => db.collection(name).deleteMany({})));
  });

  it('creates the workspace, the default space and the owner on an empty instance, and the link leads to an owner session', async () => {
    const result = await bootstrapOwner(db, { email: ' Dona@Acme.Test ', name: 'Dona', baseUrl: BASE_URL, now: new Date() });
    expect(result.email).toBe('dona@acme.test');
    expect(result.createdWorkspace).toBe(true);
    expect(result.link.startsWith('https://orbit.test/set-password#token=')).toBe(true);
    const user = await db.collection('users').findOne({ email: 'dona@acme.test' });
    expect(user).toMatchObject({ _id: result.userId, workspace_id: result.workspaceId, name: 'Dona', role: 'owner', status: 'active' });
    const workspace = await db.collection('workspaces').findOne({ _id: result.workspaceId } as any);
    expect(workspace).toMatchObject({ slug: 'main', name: 'Orbit' });
    const spaces = await db.collection('spaces').find({ workspace_id: result.workspaceId }).toArray();
    expect(spaces).toHaveLength(1);
    expect(spaces[0]).toMatchObject({ name: 'Acme', next_task_seq: 1 });
    expect(spaces[0].statuses.map((s: { name: string }) => s.name)).toEqual(DEFAULT_STATUSES.map(s => s.name));
    const tokens = await db.collection('auth_tokens').find({ user_id: result.userId }).toArray();
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ kind: 'invite', used_at: null, token_hash: createHash('sha256').update(tokenOf(result.link)).digest('hex') });
    expect(JSON.stringify(await db.collection('auth_tokens').find({}).toArray())).not.toContain(tokenOf(result.link));
    const audit = await db.collection('audit_logs').find({ action: 'auth.owner_bootstrapped' }).toArray();
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ actor_type: 'system', actor_id: 'create-owner', entity_id: result.userId, workspace_id: result.workspaceId });
    expect(JSON.stringify(audit)).not.toContain(tokenOf(result.link));
    expect(await db.collection('system_markers').findOne({ _id: 'owner_bootstrap' } as any)).toMatchObject({ user_id: result.userId, workspace_id: result.workspaceId });

    await ctx
      .http()
      .post('/auth/password/set')
      .send({ token: tokenOf(result.link), password: PASSWORD })
      .expect(204);
    const login = await ctx.http().post('/auth/login').send({ email: 'dona@acme.test', password: PASSWORD }).expect(200);
    const cookie = ([] as string[])
      .concat(login.headers['set-cookie'] ?? [])
      .find(value => value.startsWith('orbit_session=') && !value.startsWith('orbit_session=;'))!
      .split(';')[0];
    const me = await ctx.http().get('/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body.role).toBe('owner');
    expect(me.body.scopes).toEqual(expect.arrayContaining(['users:manage', 'users:invite', 'structure:write', 'tokens:manage', 'audit:read']));
    const tree = await ctx.http().get('/hierarchy').set('Cookie', cookie).expect(200);
    expect(JSON.stringify(tree.body)).toContain('Acme');
  });

  it('uses the email as the name when no name is given', async () => {
    const result = await bootstrapOwner(db, { email: 'sem-nome@acme.test', baseUrl: BASE_URL, now: new Date() });
    expect(await db.collection('users').findOne({ _id: result.userId } as any)).toMatchObject({ name: 'sem-nome@acme.test' });
  });

  it('32 parallel runs create exactly one owner, one workspace and one space', async () => {
    const runs = await Promise.allSettled(Array.from({ length: 32 }, (_, index) => bootstrapOwner(db, { email: `corrida${index}@acme.test`, baseUrl: BASE_URL, now: new Date() })));
    const fulfilled = runs.filter(run => run.status === 'fulfilled');
    const rejected = runs.filter((run): run is PromiseRejectedResult => run.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(31);
    for (const run of rejected) expect(String(run.reason.message)).toMatch(/already ran|already exists/);
    expect(await db.collection('users').countDocuments({ role: 'owner' })).toBe(1);
    expect(await db.collection('users').countDocuments({})).toBe(1);
    expect(await db.collection('workspaces').countDocuments({})).toBe(1);
    expect(await db.collection('spaces').countDocuments({})).toBe(1);
    expect(await db.collection('auth_tokens').countDocuments({})).toBe(1);
    expect(await db.collection('audit_logs').countDocuments({ action: 'auth.owner_bootstrapped' })).toBe(1);
  });

  it('a second run after the bootstrap creates and promotes nobody', async () => {
    await bootstrapOwner(db, { email: 'primeira@acme.test', baseUrl: BASE_URL, now: new Date() });
    const before = await counts();
    await expect(bootstrapOwner(db, { email: 'segunda@acme.test', baseUrl: BASE_URL, now: new Date() })).rejects.toThrow('An owner already exists');
    await expect(bootstrapOwner(db, { email: 'primeira@acme.test', baseUrl: BASE_URL, now: new Date() })).rejects.toThrow('An owner already exists');
    expect(await counts()).toEqual(before);
  });

  it('refuses on an instance whose owner was inserted by hand, without leaving a marker', async () => {
    await ctx.login('dono-manual@acme.test', 'Dono');
    expect(await db.collection('users').countDocuments({ role: 'owner' })).toBe(1);
    const before = await counts();
    await expect(bootstrapOwner(db, { email: 'nova@acme.test', baseUrl: BASE_URL, now: new Date() })).rejects.toThrow('An owner already exists');
    expect(await counts()).toEqual(before);
    expect(await db.collection('system_markers').countDocuments({})).toBe(0);
  });

  it('refuses when the marker exists even with no owner, and refuses an invalid email before writing', async () => {
    await expect(bootstrapOwner(db, { email: 'nao-e-email', baseUrl: BASE_URL, now: new Date() })).rejects.toThrow('valid --email');
    await expect(bootstrapOwner(db, { email: '', baseUrl: BASE_URL, now: new Date() })).rejects.toThrow('valid --email');
    expect(await counts()).toEqual(Object.fromEntries(COLLECTIONS.map(name => [name, 0])));
    await db.collection('system_markers').insertOne({ _id: 'owner_bootstrap', created_at: new Date() } as any);
    await expect(bootstrapOwner(db, { email: 'tarde@acme.test', baseUrl: BASE_URL, now: new Date() })).rejects.toThrow('already ran');
    expect(await db.collection('users').countDocuments({})).toBe(0);
  });

  it('reuses an existing workspace without an owner, adds no space, and refuses an email that already exists', async () => {
    await db.collection('workspaces').insertOne({ _id: 'ws-importado', name: 'Orbit', slug: 'main', created_at: new Date(), updated_at: new Date() } as any);
    await db.collection('users').insertOne({
      _id: 'membro-importado',
      workspace_id: 'ws-importado',
      email: 'membro@acme.test',
      name: 'Membro',
      role: 'member',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    } as any);
    await expect(bootstrapOwner(db, { email: 'membro@acme.test', baseUrl: BASE_URL, now: new Date() })).rejects.toThrow('already exists');
    expect(await db.collection('users').findOne({ _id: 'membro-importado' } as any)).toMatchObject({ role: 'member' });
    expect(await db.collection('system_markers').countDocuments({})).toBe(0);
    const result = await bootstrapOwner(db, { email: 'dona@acme.test', baseUrl: BASE_URL, now: new Date() });
    expect(result).toMatchObject({ workspaceId: 'ws-importado', createdWorkspace: false });
    expect(await db.collection('spaces').countDocuments({})).toBe(0);
    expect(await db.collection('users').countDocuments({ role: 'owner' })).toBe(1);
  });

  it('a failure halfway undoes what it wrote and frees the marker for a retry', async () => {
    const original = db.collection.bind(db);
    const spy = jest.spyOn(db, 'collection').mockImplementation(((name: string, options?: any) => {
      const real = original(name, options);
      if (name !== 'audit_logs') return real;
      const broken = Object.create(real);
      broken.insertOne = async () => {
        throw new Error('audit write failed');
      };
      return broken;
    }) as any);
    await expect(bootstrapOwner(db, { email: 'falha@acme.test', baseUrl: BASE_URL, now: new Date() })).rejects.toThrow('audit write failed');
    spy.mockRestore();
    expect(await counts()).toEqual(Object.fromEntries(COLLECTIONS.map(name => [name, 0])));
    const retry = await bootstrapOwner(db, { email: 'falha@acme.test', baseUrl: BASE_URL, now: new Date() });
    expect(retry.createdWorkspace).toBe(true);
    expect(await db.collection('users').countDocuments({ role: 'owner' })).toBe(1);
  });
});
