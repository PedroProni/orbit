import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

type Actor = { token: string; id: string };

const CANARY_TOKEN = 'ghp_canaryTokenValue0001';
const CANARY_S3_SECRET = 'canaryS3SecretValue0002';
const CANARY_S3_ACCESS = 'canaryS3AccessValue0003';
const CANARY_BUCKET = 'canary-bucket-name-0004';
const CANARY_ENDPOINT = 'https://canaryuser0005:canarypass0006@s3.canary.test';
const ROUTES = ['/audit-logs', '/integrations/github', '/integrations/github/deliveries', '/workspace/summary'];

describe('Integrations and security reads (e2e)', () => {
  let ctx: TestContext;
  let db: Connection;
  let owner: Actor;
  let admin: Actor;
  let member: Actor;
  let viewer: Actor;
  let guest: Actor;
  let otherAdmin: Actor;
  let mainWorkspaceId: string;
  let otherWorkspaceId: string;
  let listId: string;
  let deliveryCounter = 0;
  const saved: Record<string, string | undefined> = {};
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
  const fixture = (name: string, taskId: string) =>
    readFileSync(join(__dirname, 'fixtures/github', name), 'utf8')
      .split('__TASK__')
      .join(taskId);
  const sign = (body: string) => `sha256=${createHmac('sha256', 'whsec-test').update(body).digest('hex')}`;
  const send = (body: string, delivery = `sec-${++deliveryCounter}`, event = 'pull_request') =>
    ctx.http().post('/webhooks/github').set('Content-Type', 'application/json').set('X-GitHub-Event', event).set('X-GitHub-Delivery', delivery).set('X-Hub-Signature-256', sign(body)).send(body);
  const issue = async (who: Actor, scopes: string[], name: string) => (await ctx.http().post('/api-tokens').set(auth(who)).send({ name, scopes }).expect(201)).body;
  const createTask = async (title: string) => (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title }).expect(201)).body.id as string;
  const seedLogs = async (workspaceId: string, count: number, base: Date, sameInstantEvery = 1) =>
    db.collection('audit_logs').insertMany(
      Array.from({ length: count }, (_, index) => ({
        _id: randomUUID() as unknown as never,
        workspace_id: workspaceId,
        actor_type: 'system',
        actor_id: 'automation',
        action: 'task.updated',
        entity_type: 'task',
        entity_id: `seed-${workspaceId}-${index}`,
        meta: {},
        created_at: new Date(base.getTime() - Math.floor(index / sameInstantEvery) * 1000),
        updated_at: base,
      })),
    );

  beforeAll(async () => {
    for (const key of ['GITHUB_TOKEN', 'GITHUB_REPOSITORIES', 'S3_ENDPOINT', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET']) saved[key] = process.env[key];
    process.env.GITHUB_TOKEN = CANARY_TOKEN;
    process.env.GITHUB_REPOSITORIES = 'org/acme-bet,org/orbit-api';
    process.env.S3_ENDPOINT = CANARY_ENDPOINT;
    process.env.S3_ACCESS_KEY = CANARY_S3_ACCESS;
    process.env.S3_SECRET_KEY = CANARY_S3_SECRET;
    process.env.S3_BUCKET = CANARY_BUCKET;
    ctx = await createTestApp();
    db = ctx.app.get<Connection>(getConnectionToken());
    owner = await ctx.login('owner@acme.test', 'Owner');
    admin = await ctx.login('admin@acme.test', 'Admin', 'admin');
    member = await ctx.login('member@acme.test', 'Member', 'member');
    viewer = await ctx.login('viewer@acme.test', 'Viewer', 'viewer');
    guest = await ctx.login('guest@acme.test', 'Guest', 'guest');
    otherAdmin = await ctx.login('other@acme.test', 'Other', 'admin', 'outro');
    mainWorkspaceId = (await db.collection('workspaces').findOne({ slug: 'main' }))!._id as unknown as string;
    otherWorkspaceId = (await db.collection('workspaces').findOne({ slug: 'outro' }))!._id as unknown as string;
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    listId = (await ctx.http().post(`/spaces/${tree.body[0].id}/lists`).set(auth(owner)).send({ name: 'Segurança' }).expect(201)).body.id;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  describe('access', () => {
    it('lets the owner and an admin read the four routes', async () => {
      for (const who of [owner, admin]) for (const route of ROUTES) await ctx.http().get(route).set(auth(who)).expect(200);
    });

    it('refuses member, viewer and guest sessions and anonymous calls on the four routes', async () => {
      for (const route of ROUTES) {
        for (const who of [member, viewer, guest]) await ctx.http().get(route).set(auth(who)).expect(403);
        await ctx.http().get(route).expect(401);
      }
    });

    it('refuses a token without audit:read and a token whose owner was demoted', async () => {
      const narrow = await issue(owner, ['tasks:read'], 'só leitura de tarefas');
      for (const route of ROUTES)
        await ctx
          .http()
          .get(route)
          .set(auth({ token: narrow.token }))
          .expect(403);
      const promoted = await ctx.login('promoted@acme.test', 'Promoted', 'admin');
      const wide = await issue(promoted, ['audit:read'], 'auditoria do admin');
      for (const route of ROUTES)
        await ctx
          .http()
          .get(route)
          .set(auth({ token: wide.token }))
          .expect(200);
      await ctx.http().patch(`/users/${promoted.id}/role`).set(auth(owner)).send({ role: 'member' }).expect(200);
      for (const route of ROUTES)
        await ctx
          .http()
          .get(route)
          .set(auth({ token: wide.token }))
          .expect(403);
    });
  });

  describe('audit log', () => {
    it('shows the current name of a renamed entity and the stored id with a deleted flag after removal, never a 500', async () => {
      const taskId = await createTask('Título original');
      await ctx.http().patch(`/tasks/${taskId}`).set(auth(owner)).send({ title: 'Título novo' }).expect(200);
      const renamed = (await ctx.http().get('/audit-logs').query({ entityType: 'task', entityId: taskId }).set(auth(admin)).expect(200)).body;
      expect(renamed.items.length).toBeGreaterThanOrEqual(2);
      for (const item of renamed.items) expect(item.entity).toEqual({ type: 'task', id: taskId, label: 'Título novo', deleted: false });
      await ctx.http().delete(`/tasks/${taskId}`).set(auth(owner)).expect(204);
      const removed = (await ctx.http().get('/audit-logs').query({ entityType: 'task', entityId: taskId }).set(auth(admin)).expect(200)).body;
      expect(removed.items.map((item: { action: string }) => item.action)).toEqual(expect.arrayContaining(['task.deleted', 'task.created']));
      for (const item of removed.items) expect(item.entity).toEqual({ type: 'task', id: taskId, label: null, deleted: true });
      expect(removed.items[0].actor).toEqual({ type: 'user', id: owner.id, name: 'Owner', deleted: false });
    });

    it('marks an actor that no longer exists as deleted and keeps system actors unlabelled', async () => {
      await db.collection('audit_logs').insertMany([
        { _id: randomUUID() as unknown as never, workspace_id: mainWorkspaceId, actor_type: 'user', actor_id: 'gone-user', action: 'list.updated', entity_type: 'list', entity_id: listId, meta: {}, created_at: new Date(), updated_at: new Date() },
        { _id: randomUUID() as unknown as never, workspace_id: mainWorkspaceId, actor_type: 'webhook', actor_id: 'github', action: 'list.updated', entity_type: 'list', entity_id: listId, meta: {}, created_at: new Date(), updated_at: new Date() },
      ]);
      const res = (await ctx.http().get('/audit-logs').query({ entityType: 'list', entityId: listId, action: 'list.updated' }).set(auth(owner)).expect(200)).body;
      const byActor = Object.fromEntries(res.items.map((item: { actor: { id: string } }) => [item.actor.id, item]));
      expect(byActor['gone-user'].actor).toEqual({ type: 'user', id: 'gone-user', name: null, deleted: true });
      expect(byActor.github.actor).toEqual({ type: 'webhook', id: 'github', name: null, deleted: false });
      expect(byActor.github.entity).toEqual({ type: 'list', id: listId, label: 'Segurança', deleted: false });
    });

    it('removes sensitive meta keys at any depth and letter case', async () => {
      const entityId = `meta-${randomUUID()}`;
      await db.collection('audit_logs').insertOne({
        _id: randomUUID() as unknown as never,
        workspace_id: mainWorkspaceId,
        actor_type: 'system',
        actor_id: 'automation',
        action: 'automation.updated',
        entity_type: 'automation',
        entity_id: entityId,
        meta: { name: 'visível', Token: 'leak-a', nested: { 'Set-Cookie': 'leak-b', list: [{ PASSWORD: 'leak-c', ok: 1 }], api_key: 'leak-d' }, Authorization: 'leak-e', refreshToken: 'leak-f' },
        created_at: new Date(),
        updated_at: new Date(),
      });
      const res = await ctx.http().get('/audit-logs').query({ entityId }).set(auth(owner)).expect(200);
      expect(res.body.items[0].meta).toEqual({ name: 'visível', nested: { list: [{ ok: 1 }] } });
      expect(res.body.items[0].entity).toEqual({ type: 'automation', id: entityId, label: null, deleted: true });
      expect(JSON.stringify(res.body)).not.toMatch(/leak-/);
    });

    it('shows the name of an owner token only to the owner, in the actor, the entity and the meta', async () => {
      const ownerToken = await issue(owner, ['tasks:write', 'tasks:read'], 'nome-secreto-do-owner');
      await ctx
        .http()
        .post(`/lists/${listId}/tasks`)
        .set(auth({ token: ownerToken.token }))
        .send({ title: 'Criada por token' })
        .expect(201);
      const read = async (who: Actor, query: Record<string, string>) => (await ctx.http().get('/audit-logs').query(query).set(auth(who)).expect(200)).body;
      const asAdmin = await read(admin, { actorId: ownerToken.id });
      expect(asAdmin.items[0].actor).toEqual({ type: 'token', id: ownerToken.id, name: null, deleted: false });
      const createdAsAdmin = await read(admin, { entityType: 'api_token', entityId: ownerToken.id });
      expect(createdAsAdmin.items[0].entity).toEqual({ type: 'api_token', id: ownerToken.id, label: null, deleted: false });
      expect(createdAsAdmin.items[0].meta).toEqual({ scopes: ['tasks:write', 'tasks:read'] });
      expect(JSON.stringify([asAdmin, createdAsAdmin])).not.toContain('nome-secreto-do-owner');
      expect((await read(owner, { actorId: ownerToken.id })).items[0].actor.name).toBe('nome-secreto-do-owner');
      expect((await read(owner, { entityType: 'api_token', entityId: ownerToken.id })).items[0].meta.name).toBe('nome-secreto-do-owner');
    });

    it('filters by action group and by period', async () => {
      const taskId = await createTask('Filtro');
      const group = (await ctx.http().get('/audit-logs').query({ action: 'task', limit: 100 }).set(auth(owner)).expect(200)).body;
      expect(group.items.length).toBeGreaterThan(0);
      for (const item of group.items) expect(item.action.startsWith('task.')).toBe(true);
      expect(group.items.some((item: { entity: { id: string } }) => item.entity.id === taskId)).toBe(true);
      const future = (await ctx.http().get('/audit-logs').query({ from: '2999-01-01T00:00:00.000Z' }).set(auth(owner)).expect(200)).body;
      expect(future).toEqual({ items: [], nextCursor: null });
    });

    it('rejects operator injection, patterns, oversized limits, bad cursors and inverted periods with 400', async () => {
      const bad = [
        'action[$ne]=x',
        'actorId[$gt]=',
        'entityId[$regex]=.*',
        'action=.*',
        'action=task.*',
        'entityType=users',
        'limit=10000',
        'limit=0',
        'cursor=!!!',
        `cursor=${Buffer.from('{"t":"x","i":"a"}').toString('base64url')}`,
        `cursor=${Buffer.from('{"t":1,"i":{"$gt":""}}').toString('base64url')}`,
        'from=2026-02-01T00:00:00.000Z&to=2026-01-01T00:00:00.000Z',
        'from=yesterday',
        'workspace_id=x',
      ];
      for (const query of bad) await ctx.http().get(`/audit-logs?${query}`).set(auth(owner)).expect(400);
      for (const query of ['event=push%24', 'outcome=done', 'event[$ne]=x', 'limit=101', 'cursor=%24%24']) await ctx.http().get(`/integrations/github/deliveries?${query}`).set(auth(owner)).expect(400);
    });
  });

  describe('workspace isolation', () => {
    it('never returns rows of another workspace, not by filter and not with a cursor built from its rows', async () => {
      await seedLogs(otherWorkspaceId, 5, new Date());
      const foreign = await db.collection('audit_logs').find({ workspace_id: otherWorkspaceId }).sort({ created_at: -1 }).toArray();
      const asMain = (await ctx.http().get('/audit-logs').query({ entityId: foreign[0].entity_id }).set(auth(owner)).expect(200)).body;
      expect(asMain.items).toEqual([]);
      const forged = Buffer.from(JSON.stringify({ t: foreign[0].created_at.getTime() + 1, i: String(foreign[0]._id) })).toString('base64url');
      const page = (await ctx.http().get('/audit-logs').query({ cursor: forged, limit: 100 }).set(auth(owner)).expect(200)).body;
      for (const item of page.items) expect(foreign.map((row) => String(row._id))).not.toContain(item.id);
      const own = (await ctx.http().get('/audit-logs').query({ limit: 100 }).set(auth(otherAdmin)).expect(200)).body;
      expect(own.items.map((item: { id: string }) => item.id).sort()).toEqual(foreign.map((row) => String(row._id)).sort());
      const mainCount = await db.collection('audit_logs').countDocuments({ workspace_id: mainWorkspaceId });
      expect(mainCount).toBeGreaterThan(0);
      const summary = (await ctx.http().get('/workspace/summary').set(auth(otherAdmin)).expect(200)).body;
      expect(summary.workspace.slug).toBe('outro');
      expect(summary.members.byRole).toEqual({ owner: 1, admin: 0, member: 0, viewer: 0, guest: 0 });
    });
  });

  describe('pagination', () => {
    it('reads 250 rows in pages of 100 with unique ids, ties on the same instant and new writes in between', async () => {
      const entityPrefix = `page-${randomUUID()}`;
      const base = new Date(Date.UTC(2020, 0, 1));
      await db.collection('audit_logs').insertMany(
        Array.from({ length: 250 }, (_, index) => ({
          _id: `${entityPrefix}-${String(index).padStart(3, '0')}` as unknown as never,
          workspace_id: mainWorkspaceId,
          actor_type: 'system',
          actor_id: 'automation',
          action: 'goal.updated',
          entity_type: 'goal',
          entity_id: entityPrefix,
          meta: {},
          created_at: new Date(base.getTime() - Math.floor(index / 25) * 1000),
          updated_at: base,
        })),
      );
      const seen: string[] = [];
      let cursor: string | null = null;
      let pages = 0;
      do {
        const query: Record<string, string | number> = { entityId: entityPrefix, limit: 100 };
        if (cursor) query.cursor = cursor;
        const res = (await ctx.http().get('/audit-logs').query(query).set(auth(owner)).expect(200)).body;
        seen.push(...res.items.map((item: { id: string }) => item.id));
        cursor = res.nextCursor;
        pages += 1;
        await seedLogs(mainWorkspaceId, 3, new Date());
        await db.collection('audit_logs').insertOne({
          _id: `${entityPrefix}-new-${pages}` as unknown as never,
          workspace_id: mainWorkspaceId,
          actor_type: 'system',
          actor_id: 'automation',
          action: 'goal.updated',
          entity_type: 'goal',
          entity_id: entityPrefix,
          meta: {},
          created_at: new Date(),
          updated_at: new Date(),
        });
      } while (cursor && pages < 10);
      expect(pages).toBe(3);
      expect(seen).toHaveLength(250);
      expect(new Set(seen).size).toBe(250);
      expect(seen.every((id) => !id.includes('-new-'))).toBe(true);
      const first = (await ctx.http().get('/audit-logs').query({ entityId: entityPrefix }).set(auth(owner)).expect(200)).body;
      expect(first.items).toHaveLength(50);
    });
  });

  describe('GitHub deliveries', () => {
    it('stores nothing for an unsigned delivery', async () => {
      const before = await db.collection('webhook_deliveries').countDocuments();
      await ctx.http().post('/webhooks/github').set('Content-Type', 'application/json').set('X-GitHub-Event', 'pull_request').set('X-GitHub-Delivery', 'unsigned-1').send('{}').expect(401);
      expect(await db.collection('webhook_deliveries').countDocuments()).toBe(before);
    });

    it('records processed and ignored outcomes with repository, action and linked count', async () => {
      const taskId = await createTask('Com PR');
      await send(fixture('pr-opened.json', taskId), 'outcome-processed').expect(200);
      await send(JSON.stringify({ zen: 'ok', hook_id: 1 }), 'outcome-ping', 'ping').expect(200);
      const res = (await ctx.http().get('/integrations/github/deliveries').set(auth(admin)).expect(200)).body;
      const byId = Object.fromEntries(res.items.map((item: { deliveryId: string }) => [item.deliveryId, item]));
      expect(byId['outcome-processed']).toMatchObject({ event: 'pull_request', action: 'opened', repository: 'org/acme-bet', outcome: 'processed', linkedTasks: 1, duplicates: 0, failureCode: null });
      expect(byId['outcome-processed'].finishedAt).not.toBeNull();
      expect(byId['outcome-ping']).toMatchObject({ event: 'ping', outcome: 'ignored', linkedTasks: 0 });
      const filtered = (await ctx.http().get('/integrations/github/deliveries').query({ outcome: 'ignored' }).set(auth(admin)).expect(200)).body;
      expect(filtered.items.every((item: { outcome: string }) => item.outcome === 'ignored')).toBe(true);
      expect(JSON.stringify(res.body ?? res)).not.toMatch(/whsec-test|X-Hub-Signature|pull_request".*"body"/);
      for (const item of res.items) expect(Object.keys(item).sort()).toEqual(['action', 'deliveryId', 'duplicates', 'event', 'failureCode', 'finishedAt', 'id', 'linkedTasks', 'outcome', 'receivedAt', 'repository']);
    });

    it('keeps one row, one outcome and 31 duplicates when the same delivery arrives 32 times at once', async () => {
      const taskId = await createTask('Corrida');
      const body = fixture('pr-opened.json', taskId);
      const results = await Promise.all(Array.from({ length: 32 }, () => send(body, 'race-32')));
      expect(results.map((r) => r.status).every((status) => status === 200)).toBe(true);
      expect(results.filter((r) => r.body.status === 'processed')).toHaveLength(1);
      expect(results.filter((r) => r.body.status === 'duplicate')).toHaveLength(31);
      const rows = await db.collection('webhook_deliveries').find({ delivery_id: 'race-32' }).toArray();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ outcome: 'processed', duplicates: 31, linked_tasks: 1 });
      const links = await db.collection('pull_request_links').countDocuments({ task_id: taskId });
      expect(links).toBe(1);
    });
  });

  describe('integration status and summary', () => {
    it('returns booleans, repositories and counts, never a credential, endpoint or bucket', async () => {
      const github = await ctx.http().get('/integrations/github').set(auth(owner)).expect(200);
      expect(github.body).toMatchObject({ secretConfigured: true, tokenConfigured: true, webhookPath: '/webhooks/github' });
      expect(github.body.repositories.map((repo: { fullName: string }) => repo.fullName)).toEqual(['org/acme-bet', 'org/orbit-api']);
      const summary = await ctx.http().get('/workspace/summary').set(auth(admin)).expect(200);
      expect(summary.body.integrations).toEqual({ githubWebhookSecret: true, githubToken: true, githubRepositories: 2, automationKey: true, fileStorage: true, devLogin: true });
      expect(summary.body.members.byRole).toMatchObject({ owner: 1, viewer: 1, guest: 1 });
      expect(summary.body.counts.lists).toBeGreaterThanOrEqual(1);
      const automationKey = Buffer.alloc(32, 7).toString('base64');
      const all = await Promise.all(ROUTES.map((route) => ctx.http().get(route).set(auth(owner)).expect(200)));
      const text = all.map((res) => res.text).join('\n');
      for (const canary of [CANARY_TOKEN, CANARY_S3_SECRET, CANARY_S3_ACCESS, CANARY_BUCKET, 'canaryuser0005', 'canarypass0006', 's3.canary.test', 'whsec-test', automationKey]) expect(text).not.toContain(canary);
    });
  });
});
