import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('Tasks (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let member: { token: string; id: string };
  let outsider: { token: string; id: string };
  let spaceId: string;
  let listId: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    member = await ctx.login('member@acme.test', 'Member');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    spaceId = tree.body[0].id;
    const list = await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Backlog' }).expect(201);
    listId = list.body.id;
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('creates a task with defaults and a short id', async () => {
    const res = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'First task' }).expect(201);
    expect(res.body.id).toMatch(/^86[0-9a-z]{7}$/);
    expect(res.body.status).toBe('backlog');
    expect(res.body.watcherIds).toEqual([member.id]);
  });

  it('enforces required tag and title prefix rules from the space', async () => {
    await ctx
      .http()
      .patch(`/spaces/${spaceId}`)
      .set(auth(owner))
      .send({ requiredTags: ['back-end', 'front-end', 'bug'], titlePrefixes: ['P4T', 'SG'] })
      .expect(200);
    await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(member))
      .send({ title: 'No prefix', tags: ['bug'] })
      .expect(400);
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: '[P4T] No tag' }).expect(400);
    await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(member))
      .send({ title: '[ZZZ] Wrong prefix', tags: ['bug'] })
      .expect(400);
    const ok = await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(member))
      .send({ title: '[P4T COL] Fine', tags: ['Back-End', 'bug'] })
      .expect(201);
    expect(ok.body.tags).toEqual(['back-end', 'bug']);
    const sub = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'subtask without rules', parentId: ok.body.id }).expect(201);
    expect(sub.body.parentId).toBe(ok.body.id);
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'sub of sub', parentId: sub.body.id }).expect(400);
    await ctx
      .http()
      .patch(`/tasks/${ok.body.id}`)
      .set(auth(member))
      .send({ removeTags: ['back-end', 'bug'] })
      .expect(400);
    await ctx.http().patch(`/spaces/${spaceId}`).set(auth(owner)).send({ requiredTags: [], titlePrefixes: [] }).expect(200);
  });

  it('validates fields on create and update', async () => {
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'x', status: 'nope' }).expect(400);
    await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(member))
      .send({ title: 'x', assigneeIds: ['ghost'] })
      .expect(400);
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'x', startDate: '2026-11-10', dueDate: '2026-11-01' }).expect(400);
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'x', points: -1 }).expect(400);
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'x', priority: 'huge' }).expect(400);
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'x', unknown: true }).expect(400);
    await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(member))
      .send({ title: 'x', customFields: [{ fieldId: 'nope', value: 1 }] })
      .expect(400);
  });

  it('validates typed custom fields', async () => {
    const dd = await ctx
      .http()
      .post(`/spaces/${spaceId}/custom-fields`)
      .set(auth(owner))
      .send({ name: 'Type', type: 'dropdown', options: ['bug', 'feature'] })
      .expect(201);
    const url = await ctx.http().post(`/spaces/${spaceId}/custom-fields`).set(auth(owner)).send({ name: 'Figma', type: 'url' }).expect(201);
    const date = await ctx.http().post(`/spaces/${spaceId}/custom-fields`).set(auth(owner)).send({ name: 'Retro', type: 'date' }).expect(201);
    await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(member))
      .send({ title: 'cf bad dd', customFields: [{ fieldId: dd.body.id, value: 'not-an-option' }] })
      .expect(400);
    await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(member))
      .send({ title: 'cf bad url', customFields: [{ fieldId: url.body.id, value: 'javascript:alert(1)' }] })
      .expect(400);
    await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(member))
      .send({ title: 'cf bad date', customFields: [{ fieldId: date.body.id, value: 'tomorrow-ish' }] })
      .expect(400);
    const good = await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(member))
      .send({
        title: 'cf good',
        customFields: [
          { fieldId: dd.body.id, value: dd.body.options[0].id },
          { fieldId: url.body.id, value: 'https://figma.com/file/1' },
          { fieldId: date.body.id, value: '2026-11-04' },
        ],
      })
      .expect(201);
    expect(good.body.customFields).toHaveLength(3);
  });

  it('updates only the changed fields so concurrent edits of different fields both survive', async () => {
    const t = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'race', tags: [] }).expect(201);
    await Promise.all([
      ctx.http().patch(`/tasks/${t.body.id}`).set(auth(member)).send({ title: 'race renamed' }).expect(200),
      ctx.http().patch(`/tasks/${t.body.id}`).set(auth(owner)).send({ status: 'in development' }).expect(200),
      ctx.http().patch(`/tasks/${t.body.id}`).set(auth(owner)).send({ descriptionMd: 'desc' }).expect(200),
    ]);
    const got = await ctx.http().get(`/tasks/${t.body.id}`).set(auth(member)).expect(200);
    expect(got.body.title).toBe('race renamed');
    expect(got.body.status).toBe('in development');
    expect(got.body.descriptionMd).toBe('desc');
  });

  it('closing a status sets dateClosed and reopening clears it', async () => {
    const t = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'closable' }).expect(201);
    const closed = await ctx.http().patch(`/tasks/${t.body.id}`).set(auth(member)).send({ status: 'completed' }).expect(200);
    expect(closed.body.dateClosed).not.toBeNull();
    const reopened = await ctx.http().patch(`/tasks/${t.body.id}`).set(auth(member)).send({ status: 'to-do' }).expect(200);
    expect(reopened.body.dateClosed).toBeNull();
  });

  it('accepts old status names and case variants, tags cancelled as cancelado and refuses unknown names', async () => {
    const created = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'legacy names', status: 'testing' }).expect(201);
    expect(created.body.status).toBe('in review');
    const stuck = await ctx.http().patch(`/tasks/${created.body.id}`).set(auth(member)).send({ status: 'stuck' }).expect(200);
    expect(stuck.body.status).toBe('stuck');
    expect(stuck.body.tags).not.toContain('bloqueado');
    const done = await ctx.http().patch(`/tasks/${created.body.id}`).set(auth(member)).send({ status: 'DONE' }).expect(200);
    expect(done.body.status).toBe('completed');
    expect(done.body.dateClosed).not.toBeNull();
    await ctx.http().patch(`/tasks/${created.body.id}`).set(auth(member)).send({ status: 'shipping' }).expect(400);
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'unknown', status: 'shipping' }).expect(400);
    const blockedOnCreate = await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(member))
      .send({ title: 'cancelled on create', status: 'Cancelled', tags: ['back-end'] })
      .expect(201);
    expect(blockedOnCreate.body.status).toBe('completed');
    expect(blockedOnCreate.body.tags.sort()).toEqual(['back-end', 'cancelado']);
    expect(blockedOnCreate.body.dateClosed).not.toBeNull();
    const cancelledOnUpdate = await ctx.http().patch(`/tasks/${created.body.id}`).set(auth(member)).send({ status: 'cancelled' }).expect(200);
    expect(cancelledOnUpdate.body.tags).toContain('cancelado');
    const byLegacy = await ctx.http().get('/tasks?statuses=deployed&includeClosed=true').set(auth(member)).expect(200);
    expect(byLegacy.body.data.map((x: { id: string }) => x.id)).toContain(blockedOnCreate.body.id);
  });

  it('filters by status, assignee, tag, list, search and excludes closed by default', async () => {
    const a = await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(member))
      .send({ title: 'Filter alpha', tags: ['alpha'], assigneeIds: [member.id], status: 'in review' })
      .expect(201);
    await ctx
      .http()
      .post(`/lists/${listId}/tasks`)
      .set(auth(member))
      .send({ title: 'Filter beta', tags: ['beta'], status: 'completed' })
      .expect(201);
    const byStatus = await ctx.http().get('/tasks?statuses=In%20review').set(auth(member)).expect(200);
    expect(byStatus.body.data.map((x: { id: string }) => x.id)).toContain(a.body.id);
    const byAssignee = await ctx.http().get(`/tasks?assigneeIds=${member.id}`).set(auth(member)).expect(200);
    expect(byAssignee.body.data.every((x: { assigneeIds: string[] }) => x.assigneeIds.includes(member.id))).toBe(true);
    const byTag = await ctx.http().get('/tasks?tags=alpha').set(auth(member)).expect(200);
    expect(byTag.body.total).toBe(1);
    const search = await ctx.http().get('/tasks?q=filter%20alp').set(auth(member)).expect(200);
    expect(search.body.total).toBe(1);
    const defaultList = await ctx.http().get(`/tasks?listId=${listId}&limit=200`).set(auth(member)).expect(200);
    expect(defaultList.body.data.some((x: { title: string }) => x.title === 'Filter beta')).toBe(false);
    const withClosed = await ctx.http().get(`/tasks?listId=${listId}&includeClosed=true&limit=200`).set(auth(member)).expect(200);
    expect(withClosed.body.data.some((x: { title: string }) => x.title === 'Filter beta')).toBe(true);
    const paged = await ctx.http().get('/tasks?limit=2&page=2').set(auth(member)).expect(200);
    expect(paged.body.limit).toBe(2);
    expect(paged.body.page).toBe(2);
    await ctx.http().get('/tasks?limit=9999').set(auth(member)).expect(400);
  });

  it('says whether closed tasks are included, and asking for a status brings its closed tasks unless includeClosed=false', async () => {
    const list = await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Closed echo' }).expect(201);
    const lid = list.body.id as string;
    await ctx.http().post(`/lists/${lid}/tasks`).set(auth(member)).send({ title: 'Aberta do eco' }).expect(201);
    await ctx.http().post(`/lists/${lid}/tasks`).set(auth(member)).send({ title: 'Fechada do eco', status: 'completed' }).expect(201);
    const titles = (res: { body: { data: { title: string }[] } }) => res.body.data.map(task => task.title).sort();
    const byDefault = await ctx.http().get(`/tasks?listId=${lid}`).set(auth(member)).expect(200);
    expect(titles(byDefault)).toEqual(['Aberta do eco']);
    expect(byDefault.body.includeClosed).toBe(false);
    const byStatus = await ctx.http().get(`/tasks?listId=${lid}&statuses=completed`).set(auth(member)).expect(200);
    expect(titles(byStatus)).toEqual(['Fechada do eco']);
    expect(byStatus.body.includeClosed).toBe(true);
    const byStatusOpenOnly = await ctx.http().get(`/tasks?listId=${lid}&statuses=completed&includeClosed=false`).set(auth(member)).expect(200);
    expect(titles(byStatusOpenOnly)).toEqual([]);
    expect(byStatusOpenOnly.body.includeClosed).toBe(false);
    const all = await ctx.http().get(`/tasks?listId=${lid}&includeClosed=true`).set(auth(member)).expect(200);
    expect(titles(all)).toEqual(['Aberta do eco', 'Fechada do eco']);
    expect(all.body.includeClosed).toBe(true);
    const outsiderView = await ctx.http().get(`/tasks?listId=${lid}&statuses=completed`).set(auth(outsider)).expect(200);
    expect(outsiderView.body.data).toEqual([]);
  });

  it('filters tasks without assignee alone, with people and with search, and counts top level tasks per assignee', async () => {
    const list = await ctx.http().post(`/spaces/${spaceId}/lists`).set(auth(owner)).send({ name: 'Counts' }).expect(201);
    const lid = list.body.id;
    const create = (body: Record<string, unknown>) => ctx.http().post(`/lists/${lid}/tasks`).set(auth(member)).send(body).expect(201);
    const mine = await create({ title: 'Count alpha', assigneeIds: [member.id] });
    const shared = await create({ title: 'Count delta', assigneeIds: [owner.id, member.id] });
    const free = await create({ title: 'Count gamma' });
    const closed = await create({ title: 'Count closed', status: 'completed' });
    const child = await create({ title: 'Count child', parentId: mine.body.id });
    const ids = (res: { body: { data: Array<{ id: string }> } }) => res.body.data.map(x => x.id).sort();
    const unassigned = await ctx.http().get(`/tasks?listId=${lid}&unassigned=true&includeClosed=true`).set(auth(member)).expect(200);
    expect(ids(unassigned)).toEqual([free.body.id, closed.body.id, child.body.id].sort());
    const withOwner = await ctx.http().get(`/tasks?listId=${lid}&unassigned=true&assigneeIds=${owner.id}`).set(auth(member)).expect(200);
    expect(ids(withOwner)).toEqual([shared.body.id, free.body.id, child.body.id].sort());
    const searched = await ctx.http().get(`/tasks?listId=${lid}&unassigned=true&assigneeIds=${owner.id}&q=gamma`).set(auth(member)).expect(200);
    expect(ids(searched)).toEqual([free.body.id]);
    const counts = await ctx.http().get(`/tasks/assignee-counts?listId=${lid}`).set(auth(member)).expect(200);
    expect(counts.body.total).toBe(3);
    expect(counts.body.unassigned).toBe(1);
    expect(counts.body.byAssignee).toEqual([
      { assigneeId: member.id, count: 2 },
      { assigneeId: owner.id, count: 1 },
    ]);
    const ignoringPeople = await ctx.http().get(`/tasks/assignee-counts?listId=${lid}&assigneeIds=${owner.id}&unassigned=true`).set(auth(member)).expect(200);
    expect(ignoringPeople.body).toEqual(counts.body);
    const withClosed = await ctx.http().get(`/tasks/assignee-counts?listId=${lid}&includeClosed=true`).set(auth(member)).expect(200);
    expect(withClosed.body.total).toBe(4);
    expect(withClosed.body.unassigned).toBe(2);
    const byTitle = await ctx.http().get(`/tasks/assignee-counts?listId=${lid}&q=delta`).set(auth(member)).expect(200);
    expect(byTitle.body).toEqual({
      total: 1,
      unassigned: 0,
      byAssignee: expect.arrayContaining([
        { assigneeId: owner.id, count: 1 },
        { assigneeId: member.id, count: 1 },
      ]),
    });
    for (const entry of [...counts.body.byAssignee, { assigneeId: null, count: counts.body.unassigned }]) {
      const query = entry.assigneeId ? `assigneeIds=${entry.assigneeId}` : 'unassigned=true';
      const listed = await ctx.http().get(`/tasks?listId=${lid}&${query}&limit=200`).set(auth(member)).expect(200);
      expect(listed.body.data.filter((x: { parentId: string | null }) => !x.parentId).length).toBe(entry.count);
      const topLevel = await ctx.http().get(`/tasks?listId=${lid}&${query}&topLevel=true&limit=200`).set(auth(member)).expect(200);
      expect(topLevel.body.total).toBe(entry.count);
    }
    const tops = await ctx.http().get(`/tasks?listId=${lid}&topLevel=true&includeClosed=true`).set(auth(member)).expect(200);
    expect(ids(tops)).toEqual([mine.body.id, shared.body.id, free.body.id, closed.body.id].sort());
    expect(tops.body.total).toBe(withClosed.body.total);
    const children = await ctx.http().get(`/tasks?parentId=${mine.body.id}&topLevel=true`).set(auth(member)).expect(200);
    expect(ids(children)).toEqual([child.body.id]);
    const foreign = await ctx.http().get(`/tasks/assignee-counts?listId=${lid}`).set(auth(outsider)).expect(200);
    expect(foreign.body).toEqual({ total: 0, unassigned: 0, byAssignee: [] });
    const guest = await ctx.login('counts-guest@acme.test', 'Guest', 'guest');
    await ctx.http().get(`/tasks/assignee-counts?listId=${lid}`).set(auth(guest)).expect(403);
    await ctx.http().get(`/tasks/assignee-counts?listId=${lid}`).expect(401);
  });

  it('is isolated across workspaces (IDOR, listing, search)', async () => {
    const t = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'secret-needle' }).expect(201);
    await ctx.http().get(`/tasks/${t.body.id}`).set(auth(outsider)).expect(404);
    await ctx.http().patch(`/tasks/${t.body.id}`).set(auth(outsider)).send({ title: 'pwn' }).expect(404);
    await ctx.http().delete(`/tasks/${t.body.id}`).set(auth(outsider)).expect(404);
    await ctx.http().post(`/lists/${listId}/tasks`).set(auth(outsider)).send({ title: 'into foreign list' }).expect(404);
    const search = await ctx.http().get('/tasks?q=secret-needle').set(auth(outsider)).expect(200);
    expect(search.body.total).toBe(0);
  });

  it('handles checklists, subtasks, assignment notifications data and delete cascade', async () => {
    const t = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'parent' }).expect(201);
    const sub = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'child', parentId: t.body.id }).expect(201);
    const withChecklist = await ctx
      .http()
      .patch(`/tasks/${t.body.id}`)
      .set(auth(owner))
      .send({ checklists: [{ name: 'Deploy', items: [{ name: 'merge' }, { name: 'verify', resolved: true }] }] })
      .expect(200);
    expect(withChecklist.body.checklists[0].items[1].resolved).toBe(true);
    expect(withChecklist.body.checklists[0].id).toBeTruthy();
    const got = await ctx.http().get(`/tasks/${t.body.id}`).set(auth(owner)).expect(200);
    expect(got.body.subtasks.map((s: { id: string }) => s.id)).toEqual([sub.body.id]);
    await ctx.http().delete(`/tasks/${t.body.id}`).set(auth(owner)).expect(204);
    await ctx.http().get(`/tasks/${sub.body.id}`).set(auth(owner)).expect(404);
  });
  it('keeps concurrent tag and assignee additions and enforces the title prefix on rename', async () => {
    const space = await ctx.http().post('/spaces').set(auth(owner)).send({ name: 'Concurrency' }).expect(201);
    const list = await ctx.http().post(`/spaces/${space.body.id}/lists`).set(auth(owner)).send({ name: 'L' }).expect(201);
    await ctx
      .http()
      .patch(`/spaces/${space.body.id}`)
      .set(auth(owner))
      .send({ titlePrefixes: ['P4T'] })
      .expect(200);
    const t = await ctx.http().post(`/lists/${list.body.id}/tasks`).set(auth(owner)).send({ title: '[P4T] race' }).expect(201);
    const tagNames = ['a', 'b', 'c', 'd', 'e', 'f'];
    const results = await Promise.all(
      tagNames.map(tag =>
        ctx
          .http()
          .patch(`/tasks/${t.body.id}`)
          .set(auth(owner))
          .send({ addTags: [tag] }),
      ),
    );
    expect(results.map(r => r.status)).toEqual(tagNames.map(() => 200));
    const withAssignees = await Promise.all(
      [owner, member].map(u =>
        ctx
          .http()
          .patch(`/tasks/${t.body.id}`)
          .set(auth(owner))
          .send({ addAssigneeIds: [u.id] }),
      ),
    );
    expect(withAssignees.map(r => r.status)).toEqual([200, 200]);
    const got = await ctx.http().get(`/tasks/${t.body.id}`).set(auth(owner)).expect(200);
    expect([...got.body.tags].sort()).toEqual(tagNames);
    expect([...got.body.assigneeIds].sort()).toEqual([owner.id, member.id].sort());
    await ctx
      .http()
      .patch(`/tasks/${t.body.id}`)
      .set(auth(owner))
      .send({ removeTags: ['a'], addTags: ['z'] })
      .expect(200);
    const after = await ctx.http().get(`/tasks/${t.body.id}`).set(auth(owner)).expect(200);
    expect(after.body.tags).not.toContain('a');
    expect(after.body.tags).toContain('z');
    await ctx.http().patch(`/tasks/${t.body.id}`).set(auth(owner)).send({ title: 'no prefix now' }).expect(400);
    await ctx.http().patch(`/tasks/${t.body.id}`).set(auth(owner)).send({ title: '[P4T] renamed' }).expect(200);
  });

  it('lists the field-level history of a task newest first and hides it across workspaces', async () => {
    const t = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'history' }).expect(201);
    await ctx.http().patch(`/tasks/${t.body.id}`).set(auth(member)).send({ status: 'in development' }).expect(200);
    await ctx.http().patch(`/tasks/${t.body.id}`).set(auth(member)).send({ priority: 'high' }).expect(200);
    const res = await ctx.http().get(`/tasks/${t.body.id}/activity`).set(auth(owner)).expect(200);
    expect(res.body.map((e: { action: string }) => e.action)).toEqual(['task.updated', 'task.updated', 'task.created']);
    expect(res.body[0].diff.priority).toEqual({ before: null, after: 'high' });
    expect(res.body[1].diff.status.after).toBe('in development');
    await ctx.http().get(`/tasks/${t.body.id}/activity`).set(auth(outsider)).expect(404);
    await ctx.http().get(`/tasks/${t.body.id}/activity`).expect(401);
  });

  it('keeps Figma, Notion and prints folder links on the task with partial updates, validation and isolation', async () => {
    const t = await ctx.http().post(`/lists/${listId}/tasks`).set(auth(member)).send({ title: 'links' }).expect(201);
    expect(t.body.links).toEqual({ figma: null, notion: null, printsFolder: null });
    const id = t.body.id as string;
    await ctx
      .http()
      .patch(`/tasks/${id}`)
      .set(auth(member))
      .send({ links: { figma: ' https://www.figma.com/design/abc ' } })
      .expect(200);
    await ctx
      .http()
      .patch(`/tasks/${id}`)
      .set(auth(owner))
      .send({ links: { printsFolder: 'https://drive.google.com/drive/folders/x' } })
      .expect(200);
    const got = await ctx.http().get(`/tasks/${id}`).set(auth(member)).expect(200);
    expect(got.body.links).toEqual({ figma: 'https://www.figma.com/design/abc', notion: null, printsFolder: 'https://drive.google.com/drive/folders/x' });
    for (const bad of [{ figma: 'javascript:alert(1)' }, { notion: 'notion.so/x' }, { figma: 42 }, { evil: 'https://x.test' }, { printsFolder: `https://x.test/${'a'.repeat(2050)}` }])
      await ctx.http().patch(`/tasks/${id}`).set(auth(member)).send({ links: bad }).expect(400);
    await ctx.http().patch(`/tasks/${id}`).set(auth(member)).send({ links: 'https://x.test' }).expect(400);
    await ctx
      .http()
      .patch(`/tasks/${id}`)
      .set(auth(outsider))
      .send({ links: { figma: 'https://pwn.test' } })
      .expect(404);
    const guest = await ctx.login('links-guest@acme.test', 'Guest', 'guest');
    const guestRes = await ctx
      .http()
      .patch(`/tasks/${id}`)
      .set(auth(guest))
      .send({ links: { figma: 'https://pwn.test' } });
    expect([403, 404]).toContain(guestRes.status);
    await ctx
      .http()
      .patch(`/tasks/${id}`)
      .set(auth(member))
      .send({ links: { figma: null } })
      .expect(200);
    const after = await ctx.http().get(`/tasks/${id}`).set(auth(member)).expect(200);
    expect(after.body.links).toEqual({ figma: null, notion: null, printsFolder: 'https://drive.google.com/drive/folders/x' });
    const activity = await ctx.http().get(`/tasks/${id}/activity`).set(auth(owner)).expect(200);
    expect(activity.body[0].diff.links).toEqual({
      before: { figma: 'https://www.figma.com/design/abc', notion: null, printsFolder: 'https://drive.google.com/drive/folders/x' },
      after: { figma: null, notion: null, printsFolder: 'https://drive.google.com/drive/folders/x' },
    });
  });
});
