import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('Task templates: admin writes, guests refused, same-space lists (e2e)', () => {
  let ctx: TestContext;
  let db: Connection;
  let owner: { token: string; id: string };
  let admin: { token: string; id: string };
  let member: { token: string; id: string };
  let viewer: { token: string; id: string };
  let guest: { token: string; id: string };
  let lonelyGuest: { token: string; id: string };
  let spaceA: string;
  let spaceB: string;
  let listA: string;
  let listB: string;
  let templateA: string;
  let templateB: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
  const dto = (spaceId: string, name: string) => ({ spaceId, name, titleTemplate: `Tarefa de ${name}`, descriptionMd: 'Passos', tags: [], priority: 'normal', taskKind: 'task', estimateMinutes: 30 });
  const names = (body: { name: string }[]) => body.map(t => t.name).sort();

  beforeAll(async () => {
    ctx = await createTestApp();
    db = ctx.app.get<Connection>(getConnectionToken());
    owner = await ctx.login('owner@templates.test', 'Owner');
    admin = await ctx.login('admin@templates.test', 'Admin', 'admin');
    member = await ctx.login('member@templates.test', 'Member');
    viewer = await ctx.login('viewer@templates.test', 'Viewer', 'viewer');
    guest = await ctx.login('guest@templates.test', 'Guest', 'guest');
    lonelyGuest = await ctx.login('lonely@templates.test', 'Lonely', 'guest');
    spaceA = (await ctx.http().get('/hierarchy').set(auth(owner)).expect(200)).body[0].id;
    spaceB = (await ctx.http().post('/spaces').set(auth(owner)).send({ name: 'Espaço B' }).expect(201)).body.id;
    listA = (await ctx.http().post(`/spaces/${spaceA}/lists`).set(auth(owner)).send({ name: 'Lista A' }).expect(201)).body.id;
    listB = (await ctx.http().post(`/spaces/${spaceB}/lists`).set(auth(owner)).send({ name: 'Lista B' }).expect(201)).body.id;
    await ctx
      .http()
      .put(`/users/${guest.id}/guest-access`)
      .set(auth(owner))
      .send({ listIds: [listA] })
      .expect(200);
    templateA = (await ctx.http().post('/task-templates').set(auth(admin)).send(dto(spaceA, 'Modelo A')).expect(201)).body.id;
    templateB = (await ctx.http().post('/task-templates').set(auth(owner)).send(dto(spaceB, 'Modelo B')).expect(201)).body.id;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('lets only admins and the owner create, edit and delete templates, with an audit entry for each write', async () => {
    for (const who of [member, viewer, guest]) {
      await ctx.http().post('/task-templates').set(auth(who)).send(dto(spaceA, 'Não pode')).expect(403);
      await ctx.http().patch(`/task-templates/${templateA}`).set(auth(who)).send(dto(spaceA, 'Não pode')).expect(403);
      await ctx.http().delete(`/task-templates/${templateA}`).set(auth(who)).expect(403);
    }
    expect(await db.collection('task_templates').countDocuments({ name: 'Não pode' })).toBe(0);
    const temp = (await ctx.http().post('/task-templates').set(auth(admin)).send(dto(spaceA, 'Temporário')).expect(201)).body.id;
    await ctx.http().patch(`/task-templates/${temp}`).set(auth(admin)).send(dto(spaceA, 'Temporário editado')).expect(200);
    await ctx.http().delete(`/task-templates/${temp}`).set(auth(admin)).expect(204);
    const actions = (await db.collection('audit_logs').find({ entity_id: temp }).toArray()).map(a => a.action).sort();
    expect(actions).toEqual(['template.created', 'template.deleted', 'template.updated']);
  });

  it('shows members and viewers every template and refuses guests, even with a shared list', async () => {
    expect(names((await ctx.http().get('/task-templates').set(auth(member)).expect(200)).body)).toEqual(['Modelo A', 'Modelo B']);
    expect(names((await ctx.http().get('/task-templates').set(auth(viewer)).expect(200)).body)).toEqual(['Modelo A', 'Modelo B']);
    for (const who of [guest, lonelyGuest]) {
      await ctx.http().get('/task-templates').set(auth(who)).expect(403);
      await ctx.http().get(`/task-templates?spaceId=${spaceA}`).set(auth(who)).expect(403);
    }
  });

  it('creates a task from a template only in a list of the template space', async () => {
    const created = await ctx.http().post(`/task-templates/${templateA}/instantiate`).set(auth(member)).send({ listId: listA }).expect(201);
    expect(created.body.title).toBe('Tarefa de Modelo A');
    const before = await db.collection('tasks').countDocuments({ list_id: listB });
    const refused = await ctx.http().post(`/task-templates/${templateA}/instantiate`).set(auth(member)).send({ listId: listB }).expect(400);
    expect(refused.body.message).toBe('The list must belong to the template space');
    await ctx.http().post(`/task-templates/${templateA}/instantiate`).set(auth(member)).send({ listId: 'lista-inexistente' }).expect(404);
    expect(await db.collection('tasks').countDocuments({ list_id: listB })).toBe(before);
    await ctx.http().post(`/task-templates/${templateB}/instantiate`).set(auth(member)).send({ listId: listA }).expect(400);
    const inB = await ctx.http().post(`/task-templates/${templateB}/instantiate`).set(auth(member)).send({ listId: listB }).expect(201);
    expect(inB.body.title).toBe('Tarefa de Modelo B');
    expect(await db.collection('task_plans').countDocuments({ task_id: created.body.id })).toBe(1);
  });

  it('keeps viewers and guests from creating tasks from a template', async () => {
    await ctx.http().post(`/task-templates/${templateA}/instantiate`).set(auth(viewer)).send({ listId: listA }).expect(403);
    await ctx.http().post(`/task-templates/${templateA}/instantiate`).set(auth(guest)).send({ listId: listA }).expect(403);
  });
});
