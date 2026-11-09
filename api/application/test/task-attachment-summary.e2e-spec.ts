import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('Task list file count and cover (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let member: { token: string; id: string };
  let outsider: { token: string; id: string };
  let guest: { token: string; id: string };
  let stranger: { token: string; id: string };
  let listId: string;
  let taskId: string;
  let emptyTaskId: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
  const requestUpload = (who: { token: string }, body: Record<string, unknown>) => ctx.http().post(`/tasks/${taskId}/attachments`).set(auth(who)).send(body).expect(201);
  const upload = async (who: { token: string }, body: Record<string, unknown>) => {
    const req = await requestUpload(who, body);
    ctx.storage.objects.set(req.body.uploadUrl.split('/upload/')[1].split('?')[0], body.sizeBytes as number);
    await ctx
      .http()
      .post(`/attachments/${req.body.id as string}/confirm`)
      .set(auth(who))
      .expect(200);
    return req.body.id as string;
  };
  const rows = async (who: { token: string }) =>
    (await ctx.http().get(`/tasks?listId=${listId}`).set(auth(who)).expect(200)).body.data as Array<{ id: string; attachmentCount: number; coverAttachmentId: string | null }>;
  const row = async (who: { token: string }, id = taskId) => (await rows(who)).find(r => r.id === id);

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    member = await ctx.login('member@acme.test', 'Member');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other');
    guest = await ctx.login('guest@acme.test', 'Guest', 'guest');
    stranger = await ctx.login('stranger@acme.test', 'Stranger', 'guest');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    listId = (await ctx.http().post(`/spaces/${tree.body[0].id}/lists`).set(auth(owner)).send({ name: 'L' }).expect(201)).body.id;
    taskId = (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'Com arquivos' }).expect(201)).body.id;
    emptyTaskId = (await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'Sem arquivos' }).expect(201)).body.id;
    await ctx
      .http()
      .put(`/users/${guest.id}/guest-access`)
      .set(auth(owner))
      .send({ listIds: [listId] })
      .expect(200);
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('counts every confirmed file, comment files included and pending uploads left out, and takes the first image outside comments as the cover', async () => {
    expect(await row(member)).toMatchObject({ attachmentCount: 0, coverAttachmentId: null });
    await upload(member, { filename: 'spec.pdf', mimeType: 'application/pdf', sizeBytes: 10 });
    const comment = await ctx.http().post(`/tasks/${taskId}/comments`).set(auth(member)).send({ bodyMd: 'print no comentário' }).expect(201);
    await upload(member, { filename: 'no-comentario.png', mimeType: 'image/png', sizeBytes: 11, commentId: comment.body.id });
    const cover = await upload(member, { filename: 'capa.png', mimeType: 'image/png', sizeBytes: 12 });
    await upload(member, { filename: 'segunda.png', mimeType: 'image/png', sizeBytes: 13 });
    await requestUpload(member, { filename: 'pendente.png', mimeType: 'image/png', sizeBytes: 14 });
    expect(await row(member)).toMatchObject({ attachmentCount: 4, coverAttachmentId: cover });
    expect(await row(owner, emptyTaskId)).toMatchObject({ attachmentCount: 0, coverAttachmentId: null });
  });

  it('stops counting a deleted file and moves the cover to the next task image', async () => {
    const before = await row(member);
    await ctx.http().delete(`/attachments/${before!.coverAttachmentId!}`).set(auth(member)).expect(204);
    const after = await row(member);
    expect(after!.attachmentCount).toBe(3);
    expect(after!.coverAttachmentId).not.toBeNull();
    expect(after!.coverAttachmentId).not.toBe(before!.coverAttachmentId);
  });

  it('shows a guest only the prints and the files in the description, never a hidden image as the cover', async () => {
    expect(await row(guest)).toMatchObject({ attachmentCount: 0, coverAttachmentId: null });
    const print = await upload(member, { filename: '01-tela.png', mimeType: 'image/png', sizeBytes: 15, gallery: 'prints' });
    expect(await row(guest)).toMatchObject({ attachmentCount: 1, coverAttachmentId: print });
    const files = (await ctx.http().get(`/tasks/${taskId}/attachments`).set(auth(member)).expect(200)).body as Array<{ id: string; filename: string }>;
    const pdf = files.find(f => f.filename === 'spec.pdf')!.id;
    await ctx
      .http()
      .patch(`/tasks/${taskId}`)
      .set(auth(member))
      .send({ descriptionMd: `ver [spec](/attachments/${pdf}/content)` })
      .expect(200);
    expect(await row(guest)).toMatchObject({ attachmentCount: 2, coverAttachmentId: print });
    expect((await row(member))!.attachmentCount).toBe(4);
  });

  it('gives nothing to a guest without the list or to another workspace', async () => {
    expect(await rows(stranger)).toEqual([]);
    const foreign = await ctx.http().get(`/tasks?listId=${listId}`).set(auth(outsider));
    expect([200, 404]).toContain(foreign.status);
    expect(JSON.stringify(foreign.body)).not.toContain(taskId);
  });
});
