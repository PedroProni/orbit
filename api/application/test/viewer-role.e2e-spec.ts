import { request as httpRequest } from 'node:http';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';
import { listRoutes } from './helpers/list-routes';
import { fillRouteParams } from './helpers/fill-route-params';
import { snapshotDatabase } from './helpers/snapshot-database';
import { VIEWER_WRITE_ROUTES } from './fixtures/viewer/viewer-write-routes.constant';
import { VIEWER_ALLOWED_WRITE_ROUTES } from './fixtures/viewer/viewer-allowed-write-routes.constant';
import { VIEWER_SCOPES } from '../src/domain/constants/scopes.constant';

type Actor = { token: string; id: string };
type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

const MUTATING = ['POST', 'PUT', 'PATCH', 'DELETE'];
const key = (route: { method: string; path: string }) => `${route.method} ${route.path}`;

describe('Viewer role (e2e)', () => {
  let ctx: TestContext;
  let owner: Actor;
  let admin: Actor;
  let member: Actor;
  let viewer: Actor;
  let guest: Actor;
  let port: number;
  const ids: Record<string, string> = {};
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
  const send = (method: string, path: string, who: { token: string }, body?: Record<string, unknown>) => {
    const req = ctx.http()[method.toLowerCase() as Method](path).set(auth(who));
    return body ? req.send(body) : req;
  };
  const created = async (path: string, body: Record<string, unknown>, who: Actor = owner) => {
    const res = await ctx.http().post(path).set(auth(who)).send(body);
    if (res.status >= 300) throw new Error(`${path} answered ${res.status}: ${JSON.stringify(res.body)}`);
    return res.body.id as string;
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    admin = await ctx.login('admin@acme.test', 'Admin', 'admin');
    member = await ctx.login('member@acme.test', 'Member');
    viewer = await ctx.login('viewer@acme.test', 'Viewer', 'viewer');
    guest = await ctx.login('guest@acme.test', 'Guest', 'guest');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    ids.spaceId = tree.body[0].id;
    ids.workspaceId = (await ctx.http().get('/auth/me').set(auth(owner)).expect(200)).body.workspaceId ?? '';
    ids.folderId = await created(`/spaces/${ids.spaceId}/folders`, { name: 'Pasta' });
    ids.listId = await created(`/spaces/${ids.spaceId}/lists`, { name: 'Compartilhada' });
    ids.privateListId = await created(`/spaces/${ids.spaceId}/lists`, { name: 'Privada' });
    ids.taskId = await created(`/lists/${ids.listId}/tasks`, { title: 'Tarefa da Member', assigneeIds: [member.id] });
    ids.otherTaskId = await created(`/lists/${ids.listId}/tasks`, { title: 'Outra tarefa' });
    ids.privateTaskId = await created(`/lists/${ids.privateListId}/tasks`, { title: 'Tarefa privada' });
    await ctx.http().post(`/tasks/${ids.otherTaskId}/dependencies`).set(auth(owner)).send({ dependsOnId: ids.taskId }).expect(201);
    ids.commentId = await created(`/tasks/${ids.taskId}/comments`, { bodyMd: 'Comentário da Member' }, member);
    const upload = await ctx.http().post(`/tasks/${ids.taskId}/attachments`).set(auth(member)).send({ filename: 'spec.pdf', mimeType: 'application/pdf', sizeBytes: 10 }).expect(201);
    ctx.storage.objects.set(upload.body.uploadUrl.split('/upload/')[1].split('?')[0], 10);
    await ctx.http().post(`/attachments/${upload.body.id}/confirm`).set(auth(member)).expect(200);
    ids.attachmentId = upload.body.id;
    ids.docId = await created('/docs', { title: 'Manual', bodyMd: '# Olá', spaceId: ids.spaceId });
    ids.goalId = await created('/goals', { name: 'Q4', description: 'd', targets: [{ name: 'Receita', kind: 'number', targetValue: 200, currentValue: 50 }] });
    ids.dashboardId = await created('/dashboards', { name: 'Painel', shared: true, widgets: [{ type: 'overdue', title: 'Atrasadas' }] });
    ids.viewId = await created('/saved-views', {
      name: 'Abertas',
      viewType: 'table',
      shared: true,
      filters: { statuses: [], assigneeIds: [], tags: [], q: '', includeClosed: false },
      listId: ids.listId,
    });
    ids.channelId = await created('/chat/channels', { name: 'geral', kind: 'public' });
    await created(`/chat/channels/${ids.channelId}/messages`, { bodyMd: 'oi' });
    ids.fieldId = await created(`/spaces/${ids.spaceId}/custom-fields`, { name: 'Link', type: 'url' });
    ids.automationId = await created('/automations', {
      name: 'Etiqueta',
      listId: ids.listId,
      triggerType: 'task_created',
      triggerValue: null,
      actionType: 'add_tag',
      actionValue: 'nova',
      actionUserIds: [],
    });
    ids.formId = await created('/forms', { listId: ids.listId, name: 'Pedido', fields: [{ label: 'Assunto', required: true, target: 'title' }] });
    ids.templateId = await created('/task-templates', {
      spaceId: ids.spaceId,
      name: 'Bug padrão',
      titleTemplate: 'Corrigir bug',
      descriptionMd: 'Passos',
      tags: ['Bug'],
      priority: 'high',
      taskKind: 'bug',
      estimateMinutes: 90,
    });
    ids.groupId = await created('/user-groups', { name: 'Time', memberIds: [member.id] });
    ids.tokenId = await created('/api-tokens', { name: 'integração', scopes: ['tasks:read'] });
    ids.entryId = await created(`/tasks/${ids.taskId}/time`, { minutes: 30 }, member);
    ids.targetUserId = member.id;
    await ctx
      .http()
      .put(`/users/${guest.id}/guest-access`)
      .set(auth(owner))
      .send({ listIds: [ids.listId] })
      .expect(200);
    await ctx.app.listen(0);
    port = ctx.app.getHttpServer().address().port;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  describe('route inventory guard', () => {
    it('classifies every mutating route as refused for a viewer or explicitly allowed', () => {
      const discovered = listRoutes(ctx.app)
        .filter(route => MUTATING.includes(route.method))
        .map(key);
      const classified = [...VIEWER_WRITE_ROUTES, ...VIEWER_ALLOWED_WRITE_ROUTES].map(key);
      expect({ unclassified: discovered.filter(route => !classified.includes(route)), stale: classified.filter(route => !discovered.includes(route)) }).toEqual({ unclassified: [], stale: [] });
      expect(new Set(classified).size).toBe(classified.length);
    });

    it('guards every refused route with at least one scope a viewer does not hold', () => {
      const scopesByRoute = new Map(listRoutes(ctx.app).map(route => [key(route), route.scopes]));
      const unguarded = VIEWER_WRITE_ROUTES.map(key).filter(route => (scopesByRoute.get(route) ?? []).every(scope => VIEWER_SCOPES.includes(scope)));
      expect(unguarded).toEqual([]);
    });
  });

  describe('every write route refuses a viewer and leaves the data untouched', () => {
    let before: Record<string, string>;

    beforeAll(async () => {
      before = await snapshotDatabase(ctx.app);
    });

    it.each(VIEWER_WRITE_ROUTES.map(route => [key(route), route] as const))('%s answers 403 to a viewer', async (_name, route) => {
      const res = await send(route.method, fillRouteParams(route.path, ids), viewer, route.body);
      expect({ status: res.status, message: res.body.message ?? res.body.err }).toEqual({ status: 403, message: 'Insufficient scope' });
    });

    it('changed no document in any collection', async () => {
      const after = await snapshotDatabase(ctx.app);
      const changed = Object.keys({ ...before, ...after }).filter(name => before[name] !== after[name]);
      expect(changed).toEqual([]);
    });
  });

  describe('a viewer sees what a member sees', () => {
    it('lists people with names and avatars, which a guest cannot', async () => {
      const people = await ctx.http().get('/users').set(auth(viewer)).expect(200);
      const rows = (people.body.data ?? people.body) as Array<{ id: string; name: string; avatarUrl: unknown }>;
      expect(rows.find(row => row.id === member.id)).toMatchObject({ name: 'Member' });
      expect(rows.every(row => 'avatarUrl' in row)).toBe(true);
      await ctx.http().get('/users').set(auth(guest)).expect(403);
    });

    it('sees every list and task, not only the shared ones a guest gets', async () => {
      const names = (body: Array<{ lists?: Array<{ name: string }>; folders?: Array<{ lists?: Array<{ name: string }> }> }>) =>
        body.flatMap(space => [...(space.lists ?? []), ...(space.folders ?? []).flatMap(folder => folder.lists ?? [])]).map(list => list.name);
      expect(names((await ctx.http().get('/hierarchy').set(auth(viewer)).expect(200)).body)).toEqual(expect.arrayContaining(['Compartilhada', 'Privada']));
      expect(names((await ctx.http().get('/hierarchy').set(auth(guest)).expect(200)).body)).not.toContain('Privada');
      await ctx.http().get(`/tasks/${ids.privateTaskId}`).set(auth(viewer)).expect(200);
      await ctx.http().get(`/tasks/${ids.privateTaskId}`).set(auth(guest)).expect(404);
    });

    it('opens the task with its assignee and the comment author', async () => {
      const task = await ctx.http().get(`/tasks/${ids.taskId}`).set(auth(viewer)).expect(200);
      expect(task.body.assigneeIds).toEqual([member.id]);
      const comments = await ctx.http().get(`/tasks/${ids.taskId}/comments`).set(auth(viewer)).expect(200);
      expect(JSON.stringify(comments.body)).toContain(member.id);
    });

    it('gets the same status as a member on every read route', async () => {
      const reads = listRoutes(ctx.app).filter(
        route => route.method === 'GET' && route.scopes.every(scope => VIEWER_SCOPES.includes(scope)) && !['/events', '/public/forms/:key'].includes(route.path),
      );
      const differences = [];
      for (const route of reads) {
        const path = fillRouteParams(route.path, ids);
        const [asMember, asViewer] = [await send('GET', path, member), await send('GET', path, viewer)];
        if (asMember.status !== asViewer.status) differences.push({ route: route.path, member: asMember.status, viewer: asViewer.status });
      }
      expect(reads.length).toBeGreaterThan(30);
      expect(differences).toEqual([]);
    });

    it('receives live events over SSE', async () => {
      const stream = await new Promise<{ status: number; chunks: string[]; close: () => void }>((resolve, reject) => {
        const chunks: string[] = [];
        const req = httpRequest({ port, path: `/events?access_token=${viewer.token}` }, res => {
          res.setEncoding('utf8');
          res.on('data', d => chunks.push(d));
          resolve({ status: res.statusCode ?? 0, chunks, close: () => req.destroy() });
        });
        req.on('error', e => ((e as NodeJS.ErrnoException).code === 'ECONNRESET' ? undefined : reject(e)));
        req.end();
      });
      expect(stream.status).toBe(200);
      const task = await ctx.http().post(`/lists/${ids.listId}/tasks`).set(auth(owner)).send({ title: 'ao vivo' }).expect(201);
      await new Promise(r => setTimeout(r, 300));
      expect(stream.chunks.join('')).toContain(task.body.id);
      stream.close();
    });

    it('may still mark its own notifications as read', async () => {
      const res = await ctx.http().post('/notifications/read').set(auth(viewer)).send({});
      expect(res.status).toBeLessThan(300);
    });
  });

  describe('assigning the role', () => {
    let person: Actor;
    let promoted: Actor;
    const changeRole = (who: Actor, target: string, role: string) => ctx.http().patch(`/users/${target}/role`).set(auth(who)).send({ role });

    beforeAll(async () => {
      person = await ctx.login('person@acme.test', 'Person');
      promoted = await ctx.login('admin2@acme.test', 'Admin Two', 'admin');
    });

    it('lets an admin turn a member into a viewer, audited, effective on the next request with the same session', async () => {
      await ctx.http().post(`/lists/${ids.listId}/tasks`).set(auth(person)).send({ title: 'antes' }).expect(201);
      const res = await changeRole(admin, person.id, 'viewer').expect(200);
      expect(res.body.role).toBe('viewer');
      const audit = await ctx.app.get<Connection>(getConnectionToken()).collection('audit_logs').findOne({ action: 'user.role_changed', entity_id: person.id });
      expect(audit).toMatchObject({ actor_id: admin.id, meta: { before: 'member', after: 'viewer' } });
      await ctx.http().post(`/lists/${ids.listId}/tasks`).set(auth(person)).send({ title: 'depois' }).expect(403);
      await ctx.http().get(`/tasks/${ids.taskId}`).set(auth(person)).expect(200);
    });

    it('lets an admin move people among member, viewer and guest and back', async () => {
      await changeRole(admin, person.id, 'guest').expect(200);
      await changeRole(admin, person.id, 'viewer').expect(200);
      await changeRole(admin, person.id, 'member').expect(200);
      await ctx.http().post(`/lists/${ids.listId}/tasks`).set(auth(person)).send({ title: 'de volta' }).expect(201);
    });

    it('never lets an admin promote to admin or owner, touch an admin or owner, or change their own role', async () => {
      await changeRole(admin, person.id, 'admin').expect(403);
      await changeRole(admin, person.id, 'owner').expect(403);
      await changeRole(admin, promoted.id, 'viewer').expect(403);
      await changeRole(admin, owner.id, 'viewer').expect(403);
      await changeRole(admin, admin.id, 'viewer').expect(403);
      const after = await ctx.http().get('/users').set(auth(owner)).expect(200);
      const roles = Object.fromEntries(((after.body.data ?? after.body) as Array<{ id: string; role: string }>).map(row => [row.id, row.role]));
      expect([roles[person.id], roles[promoted.id], roles[owner.id], roles[admin.id]]).toEqual(['member', 'admin', 'owner', 'admin']);
    });

    it('refuses a viewer changing any role, its own included', async () => {
      const res = await changeRole(viewer, viewer.id, 'member').expect(403);
      expect(res.body.message).toBe('Insufficient scope');
      await changeRole(member, person.id, 'viewer').expect(403);
    });

    it('lets an admin invite a viewer directly', async () => {
      const res = await ctx.http().post('/users/invite').set(auth(admin)).send({ email: 'leitor@acme.test', name: 'Leitor', role: 'viewer' }).expect(201);
      expect(JSON.stringify(res.body)).toContain('viewer');
    });

    it('keeps concurrent role changes serial: every 200 is audited from the role it replaced and the chain ends at the stored role', async () => {
      const racer = await ctx.login('racer@acme.test', 'Racer');
      const db = ctx.app.get<Connection>(getConnectionToken());
      const statuses: number[] = [];
      for (let round = 0; round < 6; round++) {
        const responses = await Promise.all(['viewer', 'guest', 'member', 'viewer', 'guest', 'member'].map(role => changeRole(admin, racer.id, role)));
        statuses.push(...responses.map(res => res.status));
      }
      expect(statuses.every(status => status === 200 || status === 409)).toBe(true);
      const audits = await db.collection('audit_logs').find({ action: 'user.role_changed', entity_id: racer.id }).toArray();
      expect(audits).toHaveLength(statuses.filter(status => status === 200).length);
      const stored = (await db.collection('users').findOne({ _id: racer.id as never }))?.role as string;
      const balance: Record<string, number> = {};
      for (const audit of audits) {
        balance[audit.meta.before] = (balance[audit.meta.before] ?? 0) + 1;
        balance[audit.meta.after] = (balance[audit.meta.after] ?? 0) - 1;
      }
      balance.member = (balance.member ?? 0) - 1;
      balance[stored] = (balance[stored] ?? 0) + 1;
      expect(Object.values(balance).every(value => value === 0)).toBe(true);
    });

    it('never lets an admin overwrite a promotion to admin that lands between its check and its write', async () => {
      const target = await ctx.login('contested@acme.test', 'Contested');
      for (let round = 0; round < 10; round++) {
        const [promotion] = await Promise.all([changeRole(owner, target.id, 'admin'), changeRole(admin, target.id, 'viewer')]);
        const stored = (
          await ctx.app
            .get<Connection>(getConnectionToken())
            .collection('users')
            .findOne({ _id: target.id as never })
        )?.role;
        if (promotion.status === 200) expect(stored).toBe('admin');
        await changeRole(owner, target.id, 'member').expect(200);
      }
    });

    it('never lets a login running at the same time bring back the role an admin just removed', async () => {
      const target = await ctx.login('relogin@acme.test', 'Relogin');
      for (let round = 0; round < 10; round++) {
        const [demotion] = await Promise.all([changeRole(admin, target.id, 'viewer'), ...Array.from({ length: 4 }, () => ctx.login('relogin@acme.test', 'Relogin'))]);
        expect(demotion.status).toBe(200);
        const stored = (
          await ctx.app
            .get<Connection>(getConnectionToken())
            .collection('users')
            .findOne({ _id: target.id as never })
        )?.role;
        expect(stored).toBe('viewer');
        await changeRole(admin, target.id, 'member').expect(200);
      }
    });

    it('strips writing from an API token once its owner becomes a viewer', async () => {
      const token = (
        await ctx
          .http()
          .post('/api-tokens')
          .set(auth(promoted))
          .send({ name: 'escrita', scopes: ['workspace:read', 'tasks:read', 'tasks:write'] })
          .expect(201)
      ).body.token as string;
      await ctx.http().post(`/lists/${ids.listId}/tasks`).set({ Authorization: token }).send({ title: 'pelo token' }).expect(201);
      await changeRole(owner, promoted.id, 'viewer').expect(200);
      await ctx.http().post(`/lists/${ids.listId}/tasks`).set({ Authorization: token }).send({ title: 'pelo token depois' }).expect(403);
      await ctx.http().get(`/tasks/${ids.taskId}`).set({ Authorization: token }).expect(200);
    });
  });

  describe('assigning a viewer to a task (decision Q3)', () => {
    it('lets a member assign a viewer, keeps the assignment and notifies the viewer', async () => {
      const res = await ctx
        .http()
        .patch(`/tasks/${ids.otherTaskId}`)
        .set(auth(member))
        .send({ assigneeIds: [viewer.id] })
        .expect(200);
      expect(res.body.assigneeIds).toEqual([viewer.id]);
      expect((await ctx.http().get(`/tasks/${ids.otherTaskId}`).set(auth(viewer)).expect(200)).body.assigneeIds).toEqual([viewer.id]);
      const notifications = await ctx.app.get<Connection>(getConnectionToken()).collection('notifications').find({ user_id: viewer.id, task_id: ids.otherTaskId }).toArray();
      expect(notifications.map(n => n.type)).toEqual(['assignment']);
    });
  });

  describe('control pass, runs last because it changes the data', () => {
    it('the same requests reach past the scope check for the owner, so every row targets a live route', async () => {
      const results = [];
      for (const route of VIEWER_WRITE_ROUTES) {
        const res = await send(route.method, fillRouteParams(route.path, ids), owner, route.body);
        results.push({
          route: key(route),
          scopeRefused: res.status === 403 && (res.body.message ?? res.body.err) === 'Insufficient scope',
          routeMissing: res.status === 404 && String(res.body.message).startsWith('Cannot '),
        });
      }
      expect(results.filter(result => result.scopeRefused || result.routeMissing)).toEqual([]);
    });
  });
});
