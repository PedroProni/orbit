import { createHmac } from 'node:crypto';
import { createServer, IncomingHttpHeaders, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';
import { AutomationRunner } from '../src/application/services/automation-runner.service';
import { AutomationDateScheduler } from '../src/application/services/automation-date-scheduler.service';
import { EnvConfigService } from '../src/common/env/services/env-config.service';
import { AUTOMATION_RUN_INJECT_TOKEN, NOTIFICATION_INJECT_TOKEN } from '../src/domain/constants/inject-token.constant';
import { AutomationRunRepository } from '../src/domain/repositories/automation-run.repository';
import { NotificationRepository } from '../src/domain/repositories/notification.repository';

type Actor = { token: string; id: string };
type Received = { path: string; headers: IncomingHttpHeaders; body: string };

describe('Automations (e2e)', () => {
  let ctx: TestContext;
  let owner: Actor;
  let admin: Actor;
  let member: Actor;
  let other: Actor;
  let guest: Actor;
  let outsider: Actor;
  let workspaceId: string;
  let spaceId: string;
  let server: Server;
  let hookBase: string;
  const received: Received[] = [];
  const auth = (t: Actor) => ({ Authorization: `Bearer ${t.token}` });
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const waitFor = async (check: () => Promise<boolean>) => {
    for (let i = 0; i < 80; i += 1) {
      if (await check()) return;
      await sleep(50);
    }
    throw new Error('condition not met');
  };
  const newList = async (name: string) => (await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name }).expect(201)).body.id as string;
  const newTask = async (listId: string, body: Record<string, unknown>, actor: Actor = member) => (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(actor)).send(body).expect(201)).body;
  const getTask = async (id: string) => (await ctx.http().get(`/tasks/${id}`).set(auth(owner)).expect(200)).body;
  const create = async (body: Record<string, unknown>) => (await ctx.http().post('/automations').set(auth(owner)).send(body).expect(201)).body;
  const runsOf = async (id: string) =>
    (await ctx.http().get(`/automations/${id}/runs`).set(auth(owner)).expect(200)).body as {
      id: string;
      taskId: string;
      taskTitle: string | null;
      status: string;
      reason: string | null;
      createdAt: string;
    }[];
  const waitRuns = async (id: string, count: number) => {
    await waitFor(async () => (await runsOf(id)).length >= count);
    return runsOf(id);
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    admin = await ctx.login('admin@acme.test', 'Admin');
    member = await ctx.login('member@acme.test', 'Member');
    other = await ctx.login('other@acme.test', 'Other');
    guest = await ctx.login('guest@acme.test', 'Guest');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other-ws');
    workspaceId = (await ctx.http().post('/auth/dev-login').send({ email: 'owner@acme.test', name: 'Owner' }).expect(200)).body.user.workspaceId;
    await ctx.http().patch(`/users/${admin.id}/role`).set(auth(owner)).send({ role: 'admin' }).expect(200);
    await ctx.http().patch(`/users/${guest.id}/role`).set(auth(owner)).send({ role: 'guest' }).expect(200);
    admin = await ctx.login('admin@acme.test', 'Admin');
    guest = await ctx.login('guest@acme.test', 'Guest');
    spaceId = (await ctx.http().get('/hierarchy').set(auth(owner)).expect(200)).body[0].id;
    server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        received.push({ path: req.url ?? '', headers: req.headers, body: Buffer.concat(chunks).toString('utf8') });
        res.statusCode = req.url === '/fail' ? 500 : 200;
        res.end('ok');
      });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    hookBase = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }, 120000);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await closeTestApp(ctx);
  });

  it('lets only owners and admins manage automations and keeps them per workspace', async () => {
    const listId = await newList('Papéis');
    const dto = { name: 'Etiqueta', listId, triggerType: 'task_created', triggerValue: null, actionType: 'add_tag', actionValue: 'nova', actionUserIds: [] };
    for (const actor of [member, guest]) {
      await ctx.http().get('/automations').set(auth(actor)).expect(403);
      await ctx.http().post('/automations').set(auth(actor)).send(dto).expect(403);
    }
    const made = (await ctx.http().post('/automations').set(auth(admin)).send(dto).expect(201)).body;
    expect(made).toEqual({
      id: expect.any(String),
      listId,
      name: 'Etiqueta',
      triggerType: 'task_created',
      triggerValue: null,
      actionType: 'add_tag',
      actionValue: 'nova',
      actionUserIds: [],
      active: true,
      hasSecret: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      lastRun: null,
    });
    for (const actor of [member, guest]) {
      await ctx.http().patch(`/automations/${made.id}`).set(auth(actor)).send({ active: false }).expect(403);
      await ctx.http().delete(`/automations/${made.id}`).set(auth(actor)).expect(403);
      await ctx.http().get(`/automations/${made.id}/runs`).set(auth(actor)).expect(403);
    }
    await ctx.http().patch(`/automations/${made.id}`).set(auth(outsider)).send({ active: false }).expect(404);
    await ctx.http().delete(`/automations/${made.id}`).set(auth(outsider)).expect(404);
    await ctx.http().get(`/automations/${made.id}/runs`).set(auth(outsider)).expect(404);
    expect((await ctx.http().get('/automations').set(auth(outsider)).expect(200)).body).toEqual([]);
    expect((await ctx.http().get('/automations').set(auth(owner)).expect(200)).body.map((a: { id: string }) => a.id)).toContain(made.id);
    await ctx.http().delete(`/automations/${made.id}`).set(auth(admin)).expect(204);
    await ctx.http().get(`/automations/${made.id}/runs`).set(auth(owner)).expect(404);
  });

  it('accepts a toggle-only PATCH and a PATCH that moves the rule back to all lists', async () => {
    const listId = await newList('Alternar');
    const made = await create({ name: 'Concluir atribui', listId, triggerType: 'status_changed', triggerValue: 'completed', actionType: 'assign', actionValue: other.id, actionUserIds: [] });
    const paused = (await ctx.http().patch(`/automations/${made.id}`).set(auth(owner)).send({ active: false }).expect(200)).body;
    expect(paused).toMatchObject({
      id: made.id,
      active: false,
      listId,
      name: 'Concluir atribui',
      triggerType: 'status_changed',
      triggerValue: 'completed',
      actionType: 'assign',
      actionValue: other.id,
    });
    expect(paused.webhookSecret).toBeUndefined();
    const task = await newTask(listId, { title: 'Pausada' });
    await ctx.http().patch(`/tasks/${task.id}`).set(auth(member)).send({ status: 'completed' }).expect(200);
    await sleep(300);
    expect((await getTask(task.id)).assigneeIds).toEqual([]);
    expect(await runsOf(made.id)).toEqual([]);
    const resumed = (await ctx.http().patch(`/automations/${made.id}`).set(auth(owner)).send({ active: true }).expect(200)).body;
    expect(resumed).toMatchObject({ active: true, triggerValue: 'completed', actionValue: other.id, listId });
    const everywhere = (await ctx.http().patch(`/automations/${made.id}`).set(auth(owner)).send({ listId: null }).expect(200)).body;
    expect(everywhere).toMatchObject({ listId: null, active: true, triggerValue: 'completed' });
    const renamed = (await ctx.http().patch(`/automations/${made.id}`).set(auth(owner)).send({ name: 'Renomeada', triggerType: 'task_created', triggerValue: null }).expect(200)).body;
    expect(renamed).toMatchObject({ name: 'Renomeada', triggerType: 'task_created', triggerValue: null, actionType: 'assign', actionValue: other.id });
    await ctx.http().patch(`/automations/${made.id}`).set(auth(owner)).send({ listId: 'nope' }).expect(404);
    await ctx.http().patch(`/automations/${made.id}`).set(auth(owner)).send({ unknown: true }).expect(400);
    await ctx.http().delete(`/automations/${made.id}`).set(auth(owner)).expect(204);
  });

  it('refuses invalid rules with the AUTOMATION_INVALID code at the top level', async () => {
    const listId = await newList('Inválidas');
    const base = { name: 'Regra', listId, triggerType: 'task_created', triggerValue: null, actionUserIds: [] };
    const cases = [
      { ...base, actionType: 'set_priority', actionValue: 'maximum' },
      { ...base, triggerType: 'status_changed', actionType: 'add_tag', actionValue: 'x' },
      { ...base, triggerType: 'priority_changed', triggerValue: 'extreme', actionType: 'add_tag', actionValue: 'x' },
      { ...base, triggerType: 'date_reached', triggerValue: 'created_at', actionType: 'add_tag', actionValue: 'x' },
      { ...base, actionType: 'notify', actionValue: 'everyone' },
      { ...base, actionType: 'notify', actionValue: 'users', actionUserIds: [] },
      { ...base, actionType: 'comment', actionValue: 'x'.repeat(2001) },
      { ...base, name: '   ', actionType: 'add_tag', actionValue: 'x' },
    ];
    for (const body of cases) {
      const res = await ctx.http().post('/automations').set(auth(owner)).send(body).expect(400);
      expect(res.body.code).toBe('AUTOMATION_INVALID');
    }
    await ctx
      .http()
      .post('/automations')
      .set(auth(owner))
      .send({ ...base, actionType: 'assign', actionValue: 'nobody' })
      .expect(404);
    await ctx
      .http()
      .post('/automations')
      .set(auth(owner))
      .send({ ...base, actionType: 'notify', actionValue: 'users', actionUserIds: [member.id, 'nobody'] })
      .expect(404);
    await ctx
      .http()
      .post('/automations')
      .set(auth(owner))
      .send({ ...base, triggerType: 'assignee_added', triggerValue: outsider.id, actionType: 'add_tag', actionValue: 'x' })
      .expect(404);
    expect((await ctx.http().get('/automations').set(auth(owner)).expect(200)).body.filter((a: { listId: string }) => a.listId === listId)).toEqual([]);
  });

  it('runs task_created with set_priority, set_status and add_tag through the task use case as the automation actor', async () => {
    const listId = await newList('Criação');
    const priority = await create({ name: 'Urgente', listId, triggerType: 'task_created', triggerValue: null, actionType: 'set_priority', actionValue: 'urgent', actionUserIds: [] });
    const status = await create({ name: 'Em desenvolvimento', listId, triggerType: 'task_created', triggerValue: null, actionType: 'set_status', actionValue: 'in development', actionUserIds: [] });
    const tag = await create({ name: 'Etiqueta', listId, triggerType: 'task_created', triggerValue: null, actionType: 'add_tag', actionValue: 'Auto', actionUserIds: [] });
    const missing = await create({ name: 'Status inexistente', listId, triggerType: 'task_created', triggerValue: null, actionType: 'set_status', actionValue: 'shipping', actionUserIds: [] });
    const task = await newTask(listId, { title: 'Criada' });
    for (const a of [priority, status, tag, missing]) await waitRuns(a.id, 1);
    const after = await getTask(task.id);
    expect(after).toMatchObject({ priority: 'urgent', status: 'in development' });
    expect(after.tags).toContain('auto');
    expect((await runsOf(missing.id))[0]).toMatchObject({ taskId: task.id, taskTitle: 'Criada', status: 'skipped', reason: 'status_not_in_space' });
    expect((await runsOf(priority.id))[0]).toEqual({ id: expect.any(String), taskId: task.id, taskTitle: 'Criada', status: 'done', reason: null, createdAt: expect.any(String) });
    const activity = (await ctx.http().get(`/tasks/${task.id}/activity`).set(auth(owner)).expect(200)).body as { action: string; actorId: string }[];
    expect(activity.filter(a => a.actorId === 'automation').length).toBeGreaterThanOrEqual(3);
    const listed = (await ctx.http().get('/automations').set(auth(owner)).expect(200)).body.find((a: { id: string }) => a.id === priority.id);
    expect(listed.lastRun).toEqual({ status: 'done', reason: null, at: expect.any(String) });
    const elsewhere = await newTask(await newList('Fora do escopo'), { title: 'Fora' });
    await sleep(300);
    expect((await getTask(elsewhere.id)).priority).not.toBe('urgent');
    for (const a of [priority, status, tag, missing]) await ctx.http().delete(`/automations/${a.id}`).set(auth(owner)).expect(204);
  });

  it('runs status_changed with assign, and the assignee gets the assignment notification from the automation actor', async () => {
    const listId = await newList('Status');
    const assign = await create({ name: 'Revisão atribui', listId, triggerType: 'status_changed', triggerValue: 'in review', actionType: 'assign', actionValue: other.id, actionUserIds: [] });
    const task = await newTask(listId, { title: 'Revisar' });
    await ctx.http().patch(`/tasks/${task.id}`).set(auth(member)).send({ status: 'in development' }).expect(200);
    await sleep(300);
    expect(await runsOf(assign.id)).toEqual([]);
    await ctx.http().patch(`/tasks/${task.id}`).set(auth(member)).send({ status: 'in review' }).expect(200);
    await waitRuns(assign.id, 1);
    expect((await getTask(task.id)).assigneeIds).toEqual([other.id]);
    const notes = (await ctx.http().get('/notifications').set(auth(other)).expect(200)).body.data as { type: string; taskId: string; actorId: string }[];
    expect(notes).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'assignment', taskId: task.id, actorId: 'automation' })]));
    await ctx.http().delete(`/automations/${assign.id}`).set(auth(owner)).expect(204);
  });

  it('runs priority_changed only for the chosen priority and for any priority when the value is null', async () => {
    const listId = await newList('Prioridade');
    const high = await create({ name: 'Alta', listId, triggerType: 'priority_changed', triggerValue: 'high', actionType: 'add_tag', actionValue: 'alta', actionUserIds: [] });
    const any = await create({ name: 'Qualquer', listId, triggerType: 'priority_changed', triggerValue: null, actionType: 'comment', actionValue: 'Prioridade mudou', actionUserIds: [] });
    const task = await newTask(listId, { title: 'Prioridades' });
    await ctx.http().patch(`/tasks/${task.id}`).set(auth(member)).send({ priority: 'low' }).expect(200);
    await waitRuns(any.id, 1);
    expect(await runsOf(high.id)).toEqual([]);
    await ctx.http().patch(`/tasks/${task.id}`).set(auth(member)).send({ priority: 'high' }).expect(200);
    await waitRuns(high.id, 1);
    await waitRuns(any.id, 2);
    expect((await getTask(task.id)).tags).toContain('alta');
    await ctx.http().patch(`/tasks/${task.id}`).set(auth(member)).send({ title: 'Sem mudar prioridade' }).expect(200);
    await sleep(300);
    expect(await runsOf(any.id)).toHaveLength(2);
    for (const a of [high, any]) await ctx.http().delete(`/automations/${a.id}`).set(auth(owner)).expect(204);
  });

  it('runs assignee_added for the chosen user and writes the comment as the automation author', async () => {
    const listId = await newList('Responsável');
    const welcome = await create({ name: 'Boas-vindas', listId, triggerType: 'assignee_added', triggerValue: other.id, actionType: 'comment', actionValue: 'Bem-vindo à tarefa', actionUserIds: [] });
    const task = await newTask(listId, { title: 'Atribuída' });
    await ctx
      .http()
      .patch(`/tasks/${task.id}`)
      .set(auth(member))
      .send({ assigneeIds: [member.id] })
      .expect(200);
    await sleep(300);
    expect(await runsOf(welcome.id)).toEqual([]);
    await ctx
      .http()
      .patch(`/tasks/${task.id}`)
      .set(auth(member))
      .send({ assigneeIds: [member.id, other.id] })
      .expect(200);
    await waitRuns(welcome.id, 1);
    const comments = (await ctx.http().get(`/tasks/${task.id}/comments`).set(auth(owner)).expect(200)).body as { authorId: string; bodyMd: string }[];
    expect(comments).toEqual([expect.objectContaining({ authorId: 'automation', bodyMd: 'Bem-vindo à tarefa' })]);
    const created = await newTask(listId, { title: 'Já atribuída', assigneeIds: [other.id] });
    await waitFor(async () => (await runsOf(welcome.id)).some(r => r.taskId === created.id));
    await ctx.http().delete(`/automations/${welcome.id}`).set(auth(owner)).expect(204);
  });

  it('notifies assignees with the automation type and skips users who cannot read the list', async () => {
    const listId = await newList('Avisos');
    const assignees = await create({ name: 'Avisar responsáveis', listId, triggerType: 'task_created', triggerValue: null, actionType: 'notify', actionValue: 'assignees', actionUserIds: [] });
    const guests = await create({ name: 'Avisar convidado', listId, triggerType: 'task_created', triggerValue: null, actionType: 'notify', actionValue: 'users', actionUserIds: [guest.id] });
    expect(guests.actionUserIds).toEqual([guest.id]);
    const task = await newTask(listId, { title: 'Aviso', assigneeIds: [other.id] });
    await waitRuns(assignees.id, 1);
    await waitRuns(guests.id, 1);
    const notes = (await ctx.http().get('/notifications').set(auth(other)).expect(200)).body.data as { type: string; taskId: string; actorId: string }[];
    expect(notes).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'automation', taskId: task.id, actorId: 'automation' })]));
    expect((await runsOf(guests.id))[0]).toMatchObject({ status: 'skipped', reason: 'no_change' });
    expect(await ctx.app.get<NotificationRepository>(NOTIFICATION_INJECT_TOKEN).count({ workspace_id: workspaceId, user_id: guest.id, task_id: task.id })).toBe(0);
    for (const a of [assignees, guests]) await ctx.http().delete(`/automations/${a.id}`).set(auth(owner)).expect(204);
  });

  it('does not loop when two automations write each other trigger', async () => {
    const listId = await newList('Laço');
    const forward = await create({ name: 'Ida', listId, triggerType: 'status_changed', triggerValue: 'in development', actionType: 'set_status', actionValue: 'in review', actionUserIds: [] });
    const back = await create({ name: 'Volta', listId, triggerType: 'status_changed', triggerValue: 'in review', actionType: 'set_status', actionValue: 'in development', actionUserIds: [] });
    const task = await newTask(listId, { title: 'Laço' });
    await ctx.http().patch(`/tasks/${task.id}`).set(auth(member)).send({ status: 'in development' }).expect(200);
    await waitRuns(forward.id, 1);
    await sleep(400);
    expect(await runsOf(forward.id)).toHaveLength(1);
    expect(await runsOf(back.id)).toEqual([]);
    expect((await getTask(task.id)).status).toBe('in review');
    for (const a of [forward, back]) await ctx.http().delete(`/automations/${a.id}`).set(auth(owner)).expect(204);
  });

  it('runs once when the same event reaches two workers at the same time', async () => {
    const listId = await newList('Paralelo');
    const comment = await create({ name: 'Comentar', listId, triggerType: 'task_created', triggerValue: null, actionType: 'comment', actionValue: 'Uma vez', actionUserIds: [] });
    const task = await newTask(listId, { title: 'Paralela' });
    await waitRuns(comment.id, 1);
    const runner = ctx.app.get(AutomationRunner);
    const event = { workspaceId, type: 'task.created', taskId: task.id, listId, actorId: member.id, at: new Date(), eventId: 'evento-paralelo' };
    await Promise.all([runner.handle(event), runner.handle(event), runner.handle(event)]);
    expect(await runsOf(comment.id)).toHaveLength(2);
    const comments = (await ctx.http().get(`/tasks/${task.id}/comments`).set(auth(owner)).expect(200)).body as { authorId: string }[];
    expect(comments.filter(c => c.authorId === 'automation')).toHaveLength(2);
    await ctx.http().delete(`/automations/${comment.id}`).set(auth(owner)).expect(204);
    expect(await ctx.app.get<AutomationRunRepository>(AUTOMATION_RUN_INJECT_TOKEN).recentFinished(comment.id, 50)).toEqual([]);
  });

  it('signs webhook deliveries, shows the secret only once and records failed deliveries', async () => {
    const listId = await newList('Webhook');
    const hook = await create({ name: 'Webhook', listId, triggerType: 'task_created', triggerValue: null, actionType: 'webhook', actionValue: `${hookBase}/ok`, actionUserIds: [] });
    const failing = await create({ name: 'Webhook falho', listId, triggerType: 'task_created', triggerValue: null, actionType: 'webhook', actionValue: `${hookBase}/fail`, actionUserIds: [] });
    const secret = hook.webhookSecret as string;
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
    expect(hook.hasSecret).toBe(true);
    const task = await newTask(listId, { title: 'Entrega' });
    const [okRun] = await waitRuns(hook.id, 1);
    const [failRun] = await waitRuns(failing.id, 1);
    expect(okRun).toMatchObject({ status: 'done', reason: null, taskId: task.id });
    expect(failRun).toMatchObject({ status: 'failed', reason: 'webhook_status_500' });
    const delivery = received.find(r => r.path === '/ok') as Received;
    expect(delivery.headers['x-orbit-signature']).toBe(`sha256=${createHmac('sha256', secret).update(delivery.body).digest('hex')}`);
    expect(delivery.headers['x-orbit-delivery']).toBe(okRun.id);
    expect(delivery.headers['user-agent']).toBe('Orbit-Automation');
    expect(delivery.headers['content-type']).toBe('application/json');
    expect(JSON.parse(delivery.body)).toMatchObject({ delivery: okRun.id, automationId: hook.id, trigger: 'task_created', task: { id: task.id, title: 'Entrega', listId, spaceId } });
    const listing = await ctx.http().get('/automations').set(auth(owner)).expect(200);
    const runs = await ctx.http().get(`/automations/${hook.id}/runs`).set(auth(owner)).expect(200);
    for (const text of [listing.text, runs.text]) {
      expect(text).not.toContain(secret);
      expect(text).not.toContain('webhookSecret');
      expect(text).not.toContain('webhook_secret');
    }
    expect(listing.body.find((a: { id: string }) => a.id === hook.id)).toMatchObject({ hasSecret: true, lastRun: { status: 'done', reason: null, at: expect.any(String) } });
    const renamed = (await ctx.http().patch(`/automations/${hook.id}`).set(auth(owner)).send({ name: 'Webhook renomeado' }).expect(200)).body;
    expect(renamed.webhookSecret).toBeUndefined();
    const rotated = (await ctx.http().patch(`/automations/${hook.id}`).set(auth(owner)).send({ rotateSecret: true }).expect(200)).body;
    expect(rotated.webhookSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(rotated.webhookSecret).not.toBe(secret);
    const tagged = (await ctx.http().patch(`/automations/${failing.id}`).set(auth(owner)).send({ actionType: 'add_tag', actionValue: 'sem webhook' }).expect(200)).body;
    expect(tagged).toMatchObject({ actionType: 'add_tag', hasSecret: false });
    expect(tagged.webhookSecret).toBeUndefined();
    const back = (
      await ctx
        .http()
        .patch(`/automations/${failing.id}`)
        .set(auth(owner))
        .send({ actionType: 'webhook', actionValue: `${hookBase}/ok` })
        .expect(200)
    ).body;
    expect(back.webhookSecret).toMatch(/^[0-9a-f]{64}$/);
    for (const a of [hook, failing]) await ctx.http().delete(`/automations/${a.id}`).set(auth(owner)).expect(204);
  });

  it('refuses webhooks without the secret key and private addresses when they are not allowed', async () => {
    const listId = await newList('Webhook recusado');
    const base = { name: 'Webhook', listId, triggerType: 'task_created', triggerValue: null, actionType: 'webhook', actionUserIds: [] };
    const env = ctx.app.get(EnvConfigService);
    const keySpy = jest.spyOn(env, 'getAutomationSecretKey').mockReturnValue('');
    const noKey = await ctx
      .http()
      .post('/automations')
      .set(auth(owner))
      .send({ ...base, actionValue: 'https://hooks.example.com/x' })
      .expect(400);
    expect(noKey.body.code).toBe('AUTOMATION_SECRET_KEY_MISSING');
    keySpy.mockRestore();
    for (const actionValue of ['ftp://hooks.example.com/x', 'https://user:pw@hooks.example.com/x', 'not a url']) {
      const res = await ctx
        .http()
        .post('/automations')
        .set(auth(owner))
        .send({ ...base, actionValue })
        .expect(400);
      expect(res.body.code).toBe('AUTOMATION_WEBHOOK_URL_INVALID');
    }
    await ctx
      .http()
      .post('/automations')
      .set(auth(owner))
      .send({ ...base, actionValue: `https://hooks.example.com/${'a'.repeat(2048)}` })
      .expect(400);
    const kept = await create({ ...base, actionValue: `${hookBase}/ok` });
    jest.spyOn(env, 'isAutomationWebhookPrivateAllowed').mockReturnValue(false);
    for (const actionValue of ['https://127.0.0.1/x', 'https://10.0.0.8/x', 'https://[::1]/x', 'https://localhost/x', 'https://2130706433/x', 'https://[::ffff:192.168.0.1]/x']) {
      const res = await ctx
        .http()
        .post('/automations')
        .set(auth(owner))
        .send({ ...base, actionValue })
        .expect(400);
      expect(res.body.code).toBe('AUTOMATION_WEBHOOK_URL_PRIVATE');
    }
    const plain = await ctx
      .http()
      .post('/automations')
      .set(auth(owner))
      .send({ ...base, actionValue: 'http://hooks.example.com/x' })
      .expect(400);
    expect(plain.body.code).toBe('AUTOMATION_WEBHOOK_URL_INVALID');
    const before = received.length;
    await newTask(listId, { title: 'Bloqueada' });
    const [run] = await waitRuns(kept.id, 1);
    expect(run).toMatchObject({ status: 'failed', reason: 'webhook_blocked_address' });
    expect(received.length).toBe(before);
    await ctx.http().delete(`/automations/${kept.id}`).set(auth(owner)).expect(204);
  });

  it('fires date_reached once per task date from the scheduler tick and ignores closed tasks and dates before the rule', async () => {
    const listId = await newList('Datas');
    const past = await newTask(listId, { title: 'Antiga', dueDate: new Date(Date.now() - 3600000).toISOString() });
    const rule = await create({ name: 'Vencida', listId, triggerType: 'date_reached', triggerValue: 'due_date', actionType: 'add_tag', actionValue: 'vencida', actionUserIds: [] });
    const dueAt = new Date(Date.now() + 2000).toISOString();
    const due = await newTask(listId, { title: 'Vence', dueDate: dueAt });
    const closed = await newTask(listId, { title: 'Fechada', dueDate: dueAt, status: 'completed' });
    const archived = await newTask(listId, { title: 'Arquivada', dueDate: dueAt });
    await ctx.http().patch(`/tasks/${archived.id}`).set(auth(member)).send({ archived: true }).expect(200);
    const scheduler = ctx.app.get(AutomationDateScheduler);
    const later = new Date(Date.now() + 60000);
    await scheduler.tick(later);
    await scheduler.tick(later);
    await scheduler.tick(new Date(later.getTime() + 1000));
    const runs = await runsOf(rule.id);
    expect(runs).toEqual([expect.objectContaining({ taskId: due.id, status: 'done' })]);
    expect((await getTask(due.id)).tags).toContain('vencida');
    for (const t of [past, closed, archived]) expect(runs.some(r => r.taskId === t.id)).toBe(false);
    await ctx
      .http()
      .patch(`/tasks/${due.id}`)
      .set(auth(member))
      .send({ dueDate: new Date(later.getTime() + 30000).toISOString() })
      .expect(200);
    await scheduler.tick(new Date(later.getTime() + 60000));
    expect(await runsOf(rule.id)).toHaveLength(2);
    await ctx.http().delete(`/automations/${rule.id}`).set(auth(owner)).expect(204);
  });
});
