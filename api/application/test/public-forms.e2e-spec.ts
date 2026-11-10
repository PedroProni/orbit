import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';
import { USER_INJECT_TOKEN } from '../src/domain/constants/inject-token.constant';
import { PUBLIC_FORM_IP_LIMIT } from '../src/domain/constants/public-form.constant';
import { UserRepository } from '../src/domain/repositories/user.repository';

describe('Public forms: stable fields, key rotation, paused owner, limit and honeypot (e2e)', () => {
  let ctx: TestContext;
  let db: Connection;
  let owner: { token: string; id: string };
  let admin: { token: string; id: string };
  let member: { token: string; id: string };
  let outsider: { token: string; id: string };
  let listId: string;
  let otherListId: string;
  let foreignListId: string;
  let formCount = 0;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
  const fields = [
    { label: 'Assunto', required: true, target: 'title' },
    { label: 'Detalhes', required: false, target: 'description' },
  ];
  const newForm = async (who: { token: string }, overrides: Record<string, unknown> = {}) => {
    formCount += 1;
    const res = await ctx
      .http()
      .post('/forms')
      .set(auth(who))
      .send({ listId, name: `Pedido ${formCount}`, fields, ...overrides })
      .expect(201);
    return res.body as { id: string; publicKey: string; fields: { id: string; label: string }[]; paused: boolean; ownerId: string; listId: string };
  };
  const submit = (key: string, body: Record<string, unknown>) => ctx.http().post(`/public/forms/${key}`).send(body);
  const tasksIn = (list: string, title: string) => db.collection('tasks').countDocuments({ list_id: list, title });
  const adminView = async (id: string) => (await ctx.http().get('/forms').set(auth(owner)).expect(200)).body.find((f: { id: string }) => f.id === id);

  beforeAll(async () => {
    ctx = await createTestApp();
    db = ctx.app.get<Connection>(getConnectionToken());
    owner = await ctx.login('owner@forms.test', 'Owner');
    admin = await ctx.login('admin@forms.test', 'Admin', 'admin');
    member = await ctx.login('member@forms.test', 'Member');
    outsider = await ctx.login('out@forms.test', 'Out', 'owner', 'forms-other-ws');
    const spaceId = (await ctx.http().get('/hierarchy').set(auth(owner)).expect(200)).body[0].id;
    listId = (await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Entrada' }).expect(201)).body.id;
    otherListId = (await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Outra' }).expect(201)).body.id;
    const foreignSpace = (await ctx.http().get('/hierarchy').set(auth(outsider)).expect(200)).body[0].id;
    foreignListId = (await ctx.http().post(`/spaces/${foreignSpace}/lists`).set(auth(outsider)).send({ name: 'Alheia' }).expect(201)).body.id;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('keeps the field ids on edit, so a page opened before the edit still submits, and audits what changed', async () => {
    const form = await newForm(owner);
    const [title, details] = form.fields.map(f => f.id);
    const edited = await ctx
      .http()
      .patch(`/forms/${form.id}`)
      .set(auth(owner))
      .send({
        listId,
        name: 'Pedido renomeado',
        fields: [
          { id: title, label: 'Assunto do pedido', required: true, target: 'title' },
          { id: details, label: 'Detalhes', required: false, target: 'description' },
          { label: 'Contato', required: false, target: 'description' },
        ],
      })
      .expect(200);
    const ids = edited.body.fields.map((f: { id: string }) => f.id);
    expect(ids.slice(0, 2)).toEqual([title, details]);
    expect(ids[2]).not.toEqual(title);
    expect(ids[2]).not.toEqual(details);
    await submit(form.publicKey, { answers: { [title]: 'Aberta antes da edição', [details]: 'ok' } }).expect(201);
    expect(await tasksIn(listId, 'Aberta antes da edição')).toBe(1);
    const audit = await db.collection('audit_logs').findOne({ action: 'form.updated', entity_id: form.id });
    expect(audit?.meta).toEqual({ changed: ['name', 'fields'] });
  });

  it('never takes a field id from another form or repeats one inside the same form', async () => {
    const first = await newForm(owner);
    const second = await newForm(owner);
    const foreignId = first.fields[0].id;
    const own = second.fields[0].id;
    const edited = await ctx
      .http()
      .patch(`/forms/${second.id}`)
      .set(auth(owner))
      .send({
        listId,
        name: 'Ids forjados',
        fields: [
          { id: own, label: 'Assunto', required: true, target: 'title' },
          { id: own, label: 'Repetido', required: false, target: 'description' },
          { id: foreignId, label: 'De outro formulário', required: false, target: 'description' },
        ],
      })
      .expect(200);
    const ids = edited.body.fields.map((f: { id: string }) => f.id);
    expect(ids[0]).toBe(own);
    expect(new Set(ids).size).toBe(3);
    expect(ids).not.toContain(foreignId);
  });

  it('moves a form to another list of the workspace and refuses a list from another workspace', async () => {
    const form = await newForm(owner);
    await ctx.http().patch(`/forms/${form.id}`).set(auth(owner)).send({ listId: foreignListId, name: 'x', fields }).expect(404);
    const moved = await ctx
      .http()
      .patch(`/forms/${form.id}`)
      .set(auth(owner))
      .send({ listId: otherListId, name: 'Movido', fields: form.fields.map((f, i) => ({ ...fields[i], id: f.id })) })
      .expect(200);
    expect(moved.body.listId).toBe(otherListId);
    await submit(form.publicKey, { answers: { [form.fields[0].id]: 'Na outra lista' } }).expect(201);
    expect(await tasksIn(otherListId, 'Na outra lista')).toBe(1);
    expect(await tasksIn(listId, 'Na outra lista')).toBe(0);
  });

  it('rotates the public key: the old key stops at once, the new one works, only admins can do it, and it is audited', async () => {
    const form = await newForm(owner);
    await ctx.http().post(`/forms/${form.id}/rotate-key`).set(auth(member)).expect(403);
    await ctx.http().post(`/forms/${form.id}/rotate-key`).set(auth(outsider)).expect(404);
    const rotated = await ctx.http().post(`/forms/${form.id}/rotate-key`).set(auth(admin)).expect(200);
    expect(rotated.body.publicKey).not.toBe(form.publicKey);
    expect(rotated.body.fields.map((f: { id: string }) => f.id)).toEqual(form.fields.map(f => f.id));
    await ctx.http().get(`/public/forms/${form.publicKey}`).expect(404);
    await submit(form.publicKey, { answers: { [form.fields[0].id]: 'Chave velha' } }).expect(404);
    await ctx.http().get(`/public/forms/${rotated.body.publicKey}`).expect(200);
    await submit(rotated.body.publicKey, { answers: { [form.fields[0].id]: 'Chave nova' } }).expect(201);
    expect(await tasksIn(listId, 'Chave velha')).toBe(0);
    expect(await tasksIn(listId, 'Chave nova')).toBe(1);
    expect(await db.collection('audit_logs').countDocuments({ action: 'form.key_rotated', entity_id: form.id })).toBe(1);
  });

  it('never brings an old key back when an edit that read the form before a rotation saves after it', async () => {
    const form = await newForm(owner);
    const users = ctx.app.get<UserRepository>(USER_INJECT_TOKEN);
    const original = users.findByIdInWorkspace.bind(users);
    let rotatedKey = '';
    const spy = jest.spyOn(users, 'findByIdInWorkspace').mockImplementationOnce(async (userId: string, workspaceId: string) => {
      rotatedKey = (await ctx.http().post(`/forms/${form.id}/rotate-key`).set(auth(admin)).expect(200)).body.publicKey;
      return original(userId, workspaceId);
    });
    const edited = await ctx
      .http()
      .patch(`/forms/${form.id}`)
      .set(auth(owner))
      .send({ listId, name: 'Editado durante a troca', fields: form.fields.map((f, i) => ({ ...fields[i], id: f.id })) })
      .expect(200);
    spy.mockRestore();
    expect(rotatedKey).not.toBe('');
    expect(edited.body.publicKey).toBe(rotatedKey);
    expect((await db.collection('forms').findOne({ _id: form.id as never }))?.public_key).toBe(rotatedKey);
    await ctx.http().get(`/public/forms/${form.publicKey}`).expect(404);
  });

  it('pauses a form whose creator became a viewer, a guest or was disabled, until an admin saves it and takes it over', async () => {
    for (const change of [{ role: 'viewer' }, { role: 'guest' }, { status: 'disabled' }]) {
      const creator = await ctx.login(`criador-${Object.values(change)[0]}@forms.test`, 'Criador', 'admin');
      const form = await newForm(creator);
      expect(form.paused).toBe(false);
      await submit(form.publicKey, { answers: { [form.fields[0].id]: `Antes ${Object.values(change)[0]}` } }).expect(201);
      if ('role' in change) await ctx.http().patch(`/users/${creator.id}/role`).set(auth(owner)).send(change).expect(200);
      else await ctx.http().patch(`/users/${creator.id}/status`).set(auth(owner)).send(change).expect(200);
      await ctx.http().get(`/public/forms/${form.publicKey}`).expect(404);
      await submit(form.publicKey, { answers: { [form.fields[0].id]: `Depois ${Object.values(change)[0]}` } }).expect(404);
      expect(await tasksIn(listId, `Depois ${Object.values(change)[0]}`)).toBe(0);
      expect(await adminView(form.id)).toMatchObject({ paused: true, ownerId: creator.id });
      const resaved = await ctx
        .http()
        .patch(`/forms/${form.id}`)
        .set(auth(admin))
        .send({ listId, name: 'Retomado', fields: form.fields.map((f, i) => ({ ...fields[i], id: f.id })) })
        .expect(200);
      expect(resaved.body).toMatchObject({ paused: false, ownerId: admin.id });
      const transfer = await db.collection('audit_logs').findOne({ action: 'form.owner_changed', entity_id: form.id });
      expect(transfer?.meta).toEqual({ from: creator.id, to: admin.id });
      expect(transfer?.actor_id).toBe(admin.id);
      await submit(form.publicKey, { answers: { [form.fields[0].id]: `Retomado ${Object.values(change)[0]}` } }).expect(201);
      const task = await db.collection('tasks').findOne({ list_id: listId, title: `Retomado ${Object.values(change)[0]}` });
      expect(task?.watcher_ids).toEqual([admin.id]);
    }
  });

  it('keeps the owner when an admin edits a form whose creator can still write', async () => {
    const form = await newForm(admin);
    await ctx
      .http()
      .patch(`/forms/${form.id}`)
      .set(auth(owner))
      .send({ listId, name: 'Só o nome', fields: form.fields.map((f, i) => ({ ...fields[i], id: f.id })) })
      .expect(200);
    expect(await adminView(form.id)).toMatchObject({ paused: false, ownerId: admin.id });
    expect(await db.collection('audit_logs').countDocuments({ action: 'form.owner_changed', entity_id: form.id })).toBe(0);
  });

  it('silently drops a submission with the honeypot field filled, with the same answer as a real one', async () => {
    const form = await newForm(owner);
    const bot = await submit(form.publicKey, { answers: { [form.fields[0].id]: 'Robô' }, website: 'https://spam.example' }).expect(201);
    const human = await submit(form.publicKey, { answers: { [form.fields[0].id]: 'Humano' }, website: '' }).expect(201);
    expect(bot.body).toEqual(human.body);
    expect(await tasksIn(listId, 'Robô')).toBe(0);
    expect(await tasksIn(listId, 'Humano')).toBe(1);
    await submit(form.publicKey, { answers: { [form.fields[0].id]: 'x' }, extra: 'y' }).expect(400);
  });

  it('accepts exactly the per-address limit out of 32 parallel submissions and answers 429 to the rest', async () => {
    for (let round = 0; round < 3; round += 1) {
      const form = await newForm(owner);
      const results = await Promise.all(Array.from({ length: 32 }, () => submit(form.publicKey, { answers: { [form.fields[0].id]: `Paralelo ${round}` } })));
      const statuses = results.map(r => r.status);
      expect(statuses.filter(s => s === 201)).toHaveLength(PUBLIC_FORM_IP_LIMIT);
      expect(statuses.filter(s => s === 429)).toHaveLength(32 - PUBLIC_FORM_IP_LIMIT);
      expect(await tasksIn(listId, `Paralelo ${round}`)).toBe(PUBLIC_FORM_IP_LIMIT);
    }
  });

  it('counts refused and honeypot submissions against the limit, and a limit on one form leaves another form open', async () => {
    const form = await newForm(owner);
    const other = await newForm(owner);
    await submit(form.publicKey, { answers: { bogus: 'x' } }).expect(400);
    await submit(form.publicKey, { answers: { [form.fields[0].id]: 'isca' }, website: 'x' }).expect(201);
    for (let i = 0; i < PUBLIC_FORM_IP_LIMIT - 2; i += 1) await submit(form.publicKey, { answers: { [form.fields[0].id]: `Limite ${i}` } }).expect(201);
    const limited = await submit(form.publicKey, { answers: { [form.fields[0].id]: 'Passou do limite' } }).expect(429);
    expect(limited.body.message).toBe('Too many submissions, try again later');
    expect(await tasksIn(listId, 'Passou do limite')).toBe(0);
    await submit(other.publicKey, { answers: { [other.fields[0].id]: 'Outro formulário' } }).expect(201);
  });
});
