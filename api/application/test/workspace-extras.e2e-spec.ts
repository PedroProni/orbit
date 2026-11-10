import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('Forms, automations, chat, groups, guests and inbox (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let member: { token: string; id: string };
  let other: { token: string; id: string };
  let guest: { token: string; id: string };
  let outsider: { token: string; id: string };
  let spaceId: string;
  let listId: string;
  let secretListId: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
  const waitFor = async (check: () => Promise<boolean>) => {
    for (let i = 0; i < 50; i += 1) {
      if (await check()) return;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error('condition not met');
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    member = await ctx.login('member@acme.test', 'Member');
    other = await ctx.login('other@acme.test', 'Other');
    guest = await ctx.login('guest@acme.test', 'Guest');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other-ws');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    spaceId = tree.body[0].id;
    listId = (await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Visible' }).expect(201)).body.id;
    secretListId = (await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Secret' }).expect(201)).body.id;
    await ctx.http().patch(`/users/${guest.id}/role`).set(auth(owner)).send({ role: 'guest' }).expect(200);
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('serves a public form that creates tasks and rejects bad submissions', async () => {
    const dto = {
      listId,
      name: 'Pedido',
      fields: [
        { label: 'Assunto', required: true, target: 'title' },
        { label: 'Detalhes', required: false, target: 'description' },
      ],
    };
    await ctx.http().post('/forms').set(auth(member)).send(dto).expect(403);
    await ctx
      .http()
      .post('/forms')
      .set(auth(owner))
      .send({ ...dto, fields: [{ label: 'Só descrição', required: true, target: 'description' }] })
      .expect(400);
    await ctx.http().post('/forms').set(auth(outsider)).send(dto).expect(404);
    const form = await ctx.http().post('/forms').set(auth(owner)).send(dto).expect(201);
    const key = form.body.publicKey as string;
    const [title, details] = form.body.fields.map((f: { id: string }) => f.id);
    const definition = await ctx.http().get(`/public/forms/${key}`).expect(200);
    expect(definition.body.fields).toHaveLength(2);
    expect(JSON.stringify(definition.body)).not.toContain(form.body.id);
    const sent = await ctx
      .http()
      .post(`/public/forms/${key}`)
      .send({ answers: { [title]: 'Preciso de acesso', [details]: 'Urgente' } })
      .expect(201);
    const task = await ctx.http().get(`/tasks/${sent.body.taskId}`).set(auth(member)).expect(200);
    expect(task.body.title).toBe('Preciso de acesso');
    expect(task.body.descriptionMd).toContain('Urgente');
    await ctx
      .http()
      .post(`/public/forms/${key}`)
      .send({ answers: { [details]: 'sem título' } })
      .expect(400);
    await ctx
      .http()
      .post(`/public/forms/${key}`)
      .send({ answers: { [title]: 'x', bogus: 'y' } })
      .expect(400);
    await ctx
      .http()
      .post(`/public/forms/${key}`)
      .send({ answers: { [title]: 'x'.repeat(5001) } })
      .expect(400);
    await ctx.http().post('/public/forms/chave-inexistente').send({ answers: {} }).expect(404);
    await ctx
      .http()
      .patch(`/forms/${form.body.id}`)
      .set(auth(owner))
      .send({ ...dto, active: false })
      .expect(200);
    await ctx.http().get(`/public/forms/${key}`).expect(404);
    await ctx
      .http()
      .post(`/public/forms/${key}`)
      .send({ answers: { [title]: 'x' } })
      .expect(404);
    await ctx.http().delete(`/forms/${form.body.id}`).set(auth(owner)).expect(204);
  });

  it('applies the space title prefix and required tag to tasks created by a public form', async () => {
    await ctx
      .http()
      .patch(`/spaces/${spaceId}`)
      .set(auth(owner))
      .send({ titlePrefixes: ['FORM'], requiredTags: ['externo'] })
      .expect(200);
    const dto = { listId, name: 'Com regras', fields: [{ label: 'Assunto', required: true, target: 'title' }] };
    const form = await ctx.http().post('/forms').set(auth(owner)).send(dto).expect(201);
    const key = form.body.publicKey as string;
    const fieldId = (await ctx.http().get(`/public/forms/${key}`).expect(200)).body.fields[0].id as string;
    const sent = await ctx
      .http()
      .post(`/public/forms/${key}`)
      .send({ answers: { [fieldId]: 'Pedido sem prefixo' } })
      .expect(201);
    const task = await ctx.http().get(`/tasks/${sent.body.taskId}`).set(auth(owner)).expect(200);
    expect(task.body.title).toBe('[FORM] Pedido sem prefixo');
    expect(task.body.tags).toEqual(['externo']);
    await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ titlePrefixes: [], requiredTags: [] }).expect(200);
  });

  it('runs automations on create and on status change without looping', async () => {
    const dto = { name: 'Urgente ao criar', triggerType: 'task_created', actionType: 'set_priority', actionValue: 'urgent', listId };
    await ctx.http().post('/automations').set(auth(member)).send(dto).expect(403);
    await ctx.http().get('/automations').set(auth(member)).expect(403);
    await ctx
      .http()
      .post('/automations')
      .set(auth(owner))
      .send({ ...dto, actionValue: 'maximum' })
      .expect(400);
    await ctx
      .http()
      .post('/automations')
      .set(auth(owner))
      .send({ ...dto, triggerType: 'status_changed' })
      .expect(400);
    await ctx
      .http()
      .post('/automations')
      .set(auth(owner))
      .send({ ...dto, listId: 'nope' })
      .expect(404);
    await ctx.http().post('/automations').set(auth(owner)).send({ name: 'x', triggerType: 'task_created', actionType: 'assign', actionValue: 'nobody' }).expect(404);
    const urgent = await ctx.http().post('/automations').set(auth(owner)).send(dto).expect(201);
    const assign = await ctx
      .http()
      .post('/automations')
      .set(auth(owner))
      .send({ name: 'Atribuir ao concluir', triggerType: 'status_changed', triggerValue: 'completed', actionType: 'assign', actionValue: other.id, listId })
      .expect(201);
    const tag = await ctx.http().post('/automations').set(auth(owner)).send({ name: 'Etiqueta', triggerType: 'task_created', actionType: 'add_tag', actionValue: 'Auto' }).expect(201);
    const created = (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'Nova' }).expect(201)).body;
    await waitFor(async () => {
      const runs = await Promise.all([urgent, tag].map(a => ctx.http().get(`/automations/${a.body.id}/runs`).set(auth(owner)).expect(200)));
      return runs.every(r => r.body.length === 1);
    });
    const after = await ctx.http().get(`/tasks/${created.id}`).set(auth(member)).expect(200);
    expect(after.body.priority).toBe('urgent');
    expect(after.body.tags).toContain('auto');
    await ctx.http().patch(`/tasks/${created.id}`).set(auth(member)).send({ status: 'completed' }).expect(200);
    await new Promise(resolve => setTimeout(resolve, 300));
    const closed = await ctx.http().get(`/tasks/${created.id}`).set(auth(member)).expect(200);
    expect(closed.body.assigneeIds).toEqual([other.id]);
    const paused = await ctx.http().patch(`/automations/${assign.body.id}`).set(auth(owner)).send({ active: false }).expect(200);
    expect(paused.body).toMatchObject({ active: false, triggerType: 'status_changed', triggerValue: 'completed', actionValue: other.id, listId });
    const second = (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'Outra' }).expect(201)).body;
    await ctx.http().patch(`/tasks/${second.id}`).set(auth(member)).send({ status: 'completed' }).expect(200);
    await new Promise(resolve => setTimeout(resolve, 300));
    expect((await ctx.http().get(`/tasks/${second.id}`).set(auth(member)).expect(200)).body.assigneeIds).toEqual([]);
    const elsewhere = (await ctx.http().post(`/lists/${secretListId}/tasks`).set(auth(member)).send({ title: 'Fora' }).expect(201)).body;
    await new Promise(resolve => setTimeout(resolve, 300));
    expect((await ctx.http().get(`/tasks/${elsewhere.id}`).set(auth(member)).expect(200)).body.priority).not.toBe('urgent');
    for (const a of [urgent, assign, tag]) await ctx.http().delete(`/automations/${a.body.id}`).set(auth(owner)).expect(204);
    await ctx.http().get('/automations').set(auth(outsider)).expect(200).expect([]);
  });

  it('keeps private channels private and orders messages', async () => {
    const pub = await ctx.http().post('/chat/channels').set(auth(member)).send({ name: 'geral', kind: 'public' }).expect(201);
    const priv = await ctx
      .http()
      .post('/chat/channels')
      .set(auth(member))
      .send({ name: 'segredo', kind: 'private', memberIds: [other.id] })
      .expect(201);
    await ctx
      .http()
      .post('/chat/channels')
      .set(auth(member))
      .send({ name: 'x', kind: 'private', memberIds: ['nope'] })
      .expect(404);
    await ctx.http().post(`/chat/channels/${pub.body.id}/messages`).set(auth(owner)).send({ bodyMd: 'oi' }).expect(201);
    await ctx.http().post(`/chat/channels/${priv.body.id}/messages`).set(auth(other)).send({ bodyMd: 'um' }).expect(201);
    await ctx.http().post(`/chat/channels/${priv.body.id}/messages`).set(auth(member)).send({ bodyMd: 'dois' }).expect(201);
    await ctx.http().post(`/chat/channels/${priv.body.id}/messages`).set(auth(owner)).send({ bodyMd: 'intruso' }).expect(403);
    await ctx.http().get(`/chat/channels/${priv.body.id}/messages`).set(auth(owner)).expect(403);
    await ctx.http().get(`/chat/channels/${priv.body.id}/messages`).set(auth(outsider)).expect(404);
    await ctx.http().post(`/chat/channels/${priv.body.id}/messages`).set(auth(member)).send({ bodyMd: '' }).expect(400);
    const messages = await ctx.http().get(`/chat/channels/${priv.body.id}/messages`).set(auth(member)).expect(200);
    expect(messages.body.map((m: { bodyMd: string }) => m.bodyMd)).toEqual(['um', 'dois']);
    const ownerChannels = await ctx.http().get('/chat/channels').set(auth(owner)).expect(200);
    expect(ownerChannels.body.map((c: { name: string }) => c.name)).toEqual(['geral']);
    const otherChannels = await ctx.http().get('/chat/channels').set(auth(other)).expect(200);
    expect(otherChannels.body.map((c: { name: string }) => c.name).sort()).toEqual(['geral', 'segredo']);
  });

  it('manages user groups with admin-only writes', async () => {
    await ctx.http().post('/user-groups').set(auth(member)).send({ name: 'Time', memberIds: [] }).expect(403);
    await ctx
      .http()
      .post('/user-groups')
      .set(auth(owner))
      .send({ name: 'Time', memberIds: ['nope'] })
      .expect(404);
    const group = await ctx
      .http()
      .post('/user-groups')
      .set(auth(owner))
      .send({ name: 'Time', memberIds: [member.id, member.id, other.id] })
      .expect(201);
    expect(group.body.memberIds).toHaveLength(2);
    await ctx.http().get('/user-groups').set(auth(member)).expect(403);
    expect((await ctx.http().get('/user-groups').set(auth(owner)).expect(200)).body).toHaveLength(1);
    await ctx.http().get('/user-groups').set(auth(outsider)).expect(200).expect([]);
    await ctx.http().patch(`/user-groups/${group.body.id}`).set(auth(outsider)).send({ name: 'x', memberIds: [] }).expect(404);
    await ctx.http().patch(`/user-groups/${group.body.id}`).set(auth(owner)).send({ name: 'Time B', memberIds: [] }).expect(200);
    await ctx.http().delete(`/user-groups/${group.body.id}`).set(auth(owner)).expect(204);
    await ctx.http().delete(`/user-groups/${group.body.id}`).set(auth(owner)).expect(404);
  });

  it('limits guests to granted lists and read-only endpoints', async () => {
    const visible = (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'Visível' }).expect(201)).body.id;
    const secret = (await ctx.http().post(`/lists/${secretListId}/tasks`).set(auth(owner)).send({ title: 'Secreta' }).expect(201)).body.id;
    expect((await ctx.http().get('/hierarchy').set(auth(guest)).expect(200)).body).toEqual([]);
    expect((await ctx.http().get('/tasks').set(auth(guest)).expect(200)).body.data).toEqual([]);
    await ctx
      .http()
      .put(`/users/${member.id}/guest-access`)
      .set(auth(owner))
      .send({ listIds: [listId] })
      .expect(400);
    await ctx
      .http()
      .put(`/users/${guest.id}/guest-access`)
      .set(auth(member))
      .send({ listIds: [listId] })
      .expect(403);
    await ctx
      .http()
      .put(`/users/${guest.id}/guest-access`)
      .set(auth(owner))
      .send({ listIds: ['nope'] })
      .expect(404);
    await ctx
      .http()
      .put(`/users/${guest.id}/guest-access`)
      .set(auth(outsider))
      .send({ listIds: [listId] })
      .expect(404);
    await ctx
      .http()
      .put(`/users/${guest.id}/guest-access`)
      .set(auth(owner))
      .send({ listIds: [listId] })
      .expect(200);
    const tree = await ctx.http().get('/hierarchy').set(auth(guest)).expect(200);
    const listIds = tree.body.flatMap((s: { lists: { id: string }[]; folders: { lists: { id: string }[] }[] }) => [...s.lists, ...s.folders.flatMap(f => f.lists)].map(l => l.id));
    expect(listIds).toEqual([listId]);
    const tasks = await ctx.http().get('/tasks').set(auth(guest)).expect(200);
    expect(tasks.body.data.map((t: { id: string }) => t.id)).toContain(visible);
    expect(tasks.body.data.map((t: { id: string }) => t.id)).not.toContain(secret);
    expect((await ctx.http().get(`/tasks?listId=${secretListId}`).set(auth(guest)).expect(200)).body.data).toEqual([]);
    await ctx.http().get(`/tasks/${visible}`).set(auth(guest)).expect(200);
    await ctx.http().get(`/tasks/${secret}`).set(auth(guest)).expect(404);
    await ctx.http().patch(`/tasks/${visible}`).set(auth(guest)).send({ title: 'hack' }).expect(403);
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(guest)).send({ title: 'hack' }).expect(403);
    for (const path of ['/docs', '/goals', '/dashboards', '/chat/channels', '/inbox', '/automations', '/user-groups', '/users', '/search?q=Secreta'])
      await ctx.http().get(path).set(auth(guest)).expect(403);
    for (const path of ['comments', 'attachments', 'dependencies', 'plan', 'time', 'recurrence']) {
      await ctx.http().get(`/tasks/${secret}/${path}`).set(auth(guest)).expect(403);
      await ctx.http().get(`/tasks/${visible}/${path}`).set(auth(guest)).expect(403);
      await ctx.http().get(`/tasks/${secret}/${path}`).set(auth(member)).expect(200);
    }
    const stored = async (taskId: string): Promise<string> => {
      const request = await ctx.http().post(`/tasks/${taskId}/attachments`).set(auth(owner)).send({ filename: 'tela.png', mimeType: 'image/png', sizeBytes: 10 }).expect(201);
      ctx.storage.objects.set(request.body.uploadUrl.split('/upload/')[1].split('?')[0], 10);
      await ctx.http().post(`/attachments/${request.body.id}/confirm`).set(auth(owner)).expect(200);
      return request.body.id;
    };
    const content = (id: string) => `/attachments/${id}/content`;
    const secretFile = await stored(secret);
    const shownFile = await stored(visible);
    const hiddenFile = await stored(visible);
    await ctx
      .http()
      .patch(`/tasks/${secret}`)
      .set(auth(owner))
      .send({ descriptionMd: `![a](${content(secretFile)})` })
      .expect(200);
    await ctx
      .http()
      .patch(`/tasks/${visible}`)
      .set(auth(owner))
      .send({ descriptionMd: `![a](${content(shownFile)}) ![b](${content(secretFile)})` })
      .expect(200);
    const shown = await ctx.http().get(content(shownFile)).set(auth(guest)).redirects(0).expect(302);
    expect(shown.headers.location).toContain('/download/');
    expect(shown.headers['cache-control']).toBe('private, max-age=60');
    const refused = await ctx.http().get(content(secretFile)).set(auth(guest)).expect(404);
    expect(refused.headers['cache-control']).toBeUndefined();
    await ctx.http().get(content(hiddenFile)).set(auth(guest)).expect(404);
    for (const file of [shownFile, hiddenFile, secretFile]) await ctx.http().get(`/attachments/${file}/download`).set(auth(guest)).expect(403);
    await ctx.http().get(content(secretFile)).set(auth(outsider)).expect(404);
    await ctx.http().get(content(secretFile)).set(auth(member)).redirects(0).expect(302);
    await ctx.http().get(content(hiddenFile)).set(auth(member)).redirects(0).expect(302);
    await ctx.http().get(content(secretFile)).redirects(0).expect(401);
    await ctx.http().get(content('nope')).set(auth(member)).expect(404);
    await ctx.http().patch(`/tasks/${visible}`).set(auth(owner)).send({ descriptionMd: 'sem imagem' }).expect(200);
    await ctx.http().get(content(shownFile)).set(auth(guest)).expect(404);
  });

  it('keeps a task due today out of overdue, whatever the hour stored', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const dueToday = (
      await ctx
        .http()
        .post(`/lists/${listId}/tasks`)
        .set(auth(owner))
        .send({ title: 'Vence hoje', assigneeIds: [other.id], dueDate: `${today}T00:00:00.000Z` })
        .expect(201)
    ).body.id;
    const lateYesterday = (
      await ctx
        .http()
        .post(`/lists/${listId}/tasks`)
        .set(auth(owner))
        .send({ title: 'Venceu ontem', assigneeIds: [other.id], dueDate: `${yesterday}T23:59:59.000Z` })
        .expect(201)
    ).body.id;
    const inbox = await ctx.http().get('/inbox').set(auth(other)).expect(200);
    const overdue = inbox.body.overdue.map((t: { id: string }) => t.id);
    const dueSoon = inbox.body.dueSoon.map((t: { id: string }) => t.id);
    expect(overdue).not.toContain(dueToday);
    expect(dueSoon).toContain(dueToday);
    expect(overdue).toContain(lateYesterday);
    expect(dueSoon).not.toContain(lateYesterday);
  });

  it('summarises the inbox for the current user', async () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const soon = new Date(Date.now() + 86400000).toISOString();
    const a = (
      await ctx
        .http()
        .post(`/lists/${listId}/tasks`)
        .set(auth(owner))
        .send({ title: 'Atrasada', assigneeIds: [other.id], dueDate: past })
        .expect(201)
    ).body.id;
    await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(owner))
      .send({ title: 'Em breve', assigneeIds: [other.id], dueDate: soon })
      .expect(201);
    const inbox = await ctx.http().get('/inbox').set(auth(other)).expect(200);
    expect(inbox.body.overdue.map((t: { id: string }) => t.id)).toContain(a);
    expect(inbox.body.dueSoon.map((t: { title: string }) => t.title)).toContain('Em breve');
    expect(inbox.body.unreadNotifications).toBeGreaterThan(0);
    const mine = await ctx.http().get('/inbox').set(auth(member)).expect(200);
    expect(mine.body.overdue.map((t: { id: string }) => t.id)).not.toContain(a);
  });
});
