import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';

describe('Task GitHub pull requests and prints (e2e)', () => {
  let ctx: TestContext;
  let owner: { token: string; id: string };
  let member: { token: string; id: string };
  let outsider: { token: string; id: string };
  let guest: { token: string; id: string };
  let stranger: { token: string; id: string };
  let taskId: string;
  let otherTaskId: string;
  let listId: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
  const webhook = (name: string) => {
    const body = readFileSync(join(__dirname, 'fixtures/github', name), 'utf8')
      .split('__TASK__')
      .join(taskId);
    const signature = `sha256=${createHmac('sha256', 'whsec-test').update(body).digest('hex')}`;
    return ctx
      .http()
      .post('/webhooks/github')
      .set('Content-Type', 'application/json')
      .set('X-GitHub-Event', 'pull_request')
      .set('X-GitHub-Delivery', `d-${name}-${Date.now()}`)
      .set('X-Hub-Signature-256', signature)
      .send(body);
  };
  const webhookFor = (id: string, number: number) => {
    const body = JSON.stringify({
      action: 'opened',
      number,
      repository: { full_name: 'acme/race' },
      pull_request: { number, title: `[P4T] corrida ${id}`, body: null, html_url: `https://github.com/acme/race/pull/${number}`, merged: false, head: { ref: 'feat/race' } },
    });
    const signature = `sha256=${createHmac('sha256', 'whsec-test').update(body).digest('hex')}`;
    return ctx
      .http()
      .post('/webhooks/github')
      .set('Content-Type', 'application/json')
      .set('X-GitHub-Event', 'pull_request')
      .set('X-GitHub-Delivery', `d-race-${id}-${number}`)
      .set('X-Hub-Signature-256', signature)
      .send(body);
  };
  const prs = async (who: { token: string }, id = taskId) => (await ctx.http().get(`/tasks/${id}/pull-requests`).set(auth(who)).expect(200)).body as Array<Record<string, unknown>>;
  const link = (who: { token: string }, url: unknown, id = taskId) => ctx.http().post(`/tasks/${id}/pull-requests`).set(auth(who)).send({ url });

  beforeAll(async () => {
    ctx = await createTestApp();
    owner = await ctx.login('owner@acme.test', 'Owner');
    member = await ctx.login('member@acme.test', 'Member');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other');
    guest = await ctx.login('guest@acme.test', 'Guest', 'guest');
    stranger = await ctx.login('stranger@acme.test', 'Stranger', 'guest');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    const list = await ctx.http().post(`/spaces/${tree.body[0].id}/lists`).set(auth(owner)).send({ name: 'L' }).expect(201);
    taskId = (await ctx.http().post(`/lists/${list.body.id}/tasks`).set(auth(owner)).send({ title: 'T' }).expect(201)).body.id;
    listId = (list.body as { id: string }).id;
    otherTaskId = (await ctx.http().post(`/lists/${list.body.id}/tasks`).set(auth(owner)).send({ title: 'Outra' }).expect(201)).body.id;
    await ctx
      .http()
      .put(`/users/${guest.id}/guest-access`)
      .set(auth(owner))
      .send({ listIds: [list.body.id] })
      .expect(200);
  }, 120000);

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  it('lists the pull requests stored by the GitHub webhook and keeps them from being removed by hand', async () => {
    expect(await prs(member)).toEqual([]);
    await webhook('pr-opened.json').expect(200);
    const rows = await prs(member);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ repository: 'org/acme-bet', number: 101, url: 'https://github.com/org/acme-bet/pull/101', state: 'open', source: 'webhook', taskId });
    expect(Object.keys(rows[0]).sort()).toEqual([
      'authorAvatarUrl',
      'authorLogin',
      'checksState',
      'createdAt',
      'draft',
      'githubUpdatedAt',
      'headRef',
      'id',
      'number',
      'repository',
      'source',
      'state',
      'syncedAt',
      'taskId',
      'title',
      'updatedAt',
      'url',
    ]);
    await ctx
      .http()
      .delete(`/tasks/${taskId}/pull-requests/${rows[0].id as string}`)
      .set(auth(owner))
      .expect(409);
    const same = await link(member, 'https://github.com/ORG/Acme-Bet/pull/101/files').expect(200);
    expect(same.body.id).toBe(rows[0].id);
    expect(await prs(member)).toHaveLength(1);
  });

  it('links a pull request by URL once, even when repeated or sent at the same time, and records it in the activity', async () => {
    const first = await link(member, ' https://github.com/acme/api/pull/5 ').expect(201);
    expect(first.body).toMatchObject({ repository: 'acme/api', number: 5, url: 'https://github.com/acme/api/pull/5', title: '', state: null, source: 'manual' });
    const again = await link(owner, 'https://www.github.com/acme/api/pull/5?tab=checks#top').expect(200);
    expect(again.body.id).toBe(first.body.id);
    const burst = await Promise.all(Array.from({ length: 6 }, () => link(member, 'https://github.com/acme/web/pull/77')));
    expect(burst.filter(r => r.status === 201)).toHaveLength(1);
    expect(burst.every(r => r.status === 201 || r.status === 200)).toBe(true);
    expect(new Set(burst.map(r => r.body.id as string)).size).toBe(1);
    const rows = await prs(member);
    expect(rows.map(r => `${r.repository as string}#${r.number as number}`).sort()).toEqual(['acme/api#5', 'acme/web#77', 'org/acme-bet#101']);
    const activity = await ctx.http().get(`/tasks/${taskId}/activity`).set(auth(owner)).expect(200);
    const linked = activity.body.filter((a: { action: string }) => a.action === 'task.pull_request_linked');
    expect(linked).toHaveLength(2);
    expect(linked.map((a: { diff: { pullRequests: { after: string } } }) => a.diff.pullRequests.after).sort()).toEqual(['acme/api#5', 'acme/web#77']);
    expect(await prs(member, otherTaskId)).toEqual([]);
  });

  it('keeps the GitHub state when a manual link and the webhook of the same pull request arrive at the same time', async () => {
    const raceTaskId = ((await ctx.http().post(`/lists/${listId}/tasks`).set(auth(owner)).send({ title: 'Corrida' }).expect(201)).body as { id: string }).id;
    const numbers = Array.from({ length: 15 }, (_, i) => 500 + i);
    const rounds = await Promise.all(numbers.map(n => Promise.all([link(member, `https://github.com/acme/race/pull/${n}`, raceTaskId), webhookFor(raceTaskId, n)])));
    expect(rounds.map(([manual, hook]) => [manual.status === 201 || manual.status === 200, hook.status])).toEqual(numbers.map(() => [true, 200]));
    expect(rounds.every(([, hook]) => (hook.body as { status: string }).status === 'processed')).toBe(true);
    const rows = await prs(member, raceTaskId);
    expect(rows.map(r => r.number).sort()).toEqual(numbers);
    expect(rows.every(r => r.state === 'open')).toBe(true);
  });

  it('refuses links that are not GitHub pull requests and unknown fields', async () => {
    for (const bad of [
      'javascript:alert(1)',
      'http://github.com/a/b/pull/1',
      'https://github.com.evil.test/a/b/pull/1',
      'https://evil.test/github.com/a/b/pull/1',
      'https://github.com/a/b/issues/1',
      'https://github.com/a/b/pull/0',
      '',
      '   ',
      42,
      null,
      `https://github.com/a/b/pull/1?${'x'.repeat(600)}`,
    ])
      await link(member, bad).expect(400);
    await ctx.http().post(`/tasks/${taskId}/pull-requests`).set(auth(member)).send({ url: 'https://github.com/a/b/pull/1', state: 'merged' }).expect(400);
    expect((await prs(member)).some(r => r.repository === 'a/b')).toBe(false);
  });

  it('removes only manual links of the same task and logs the removal', async () => {
    const manual = (await link(member, 'https://github.com/acme/rm/pull/9').expect(201)).body;
    await ctx
      .http()
      .delete(`/tasks/${otherTaskId}/pull-requests/${manual.id as string}`)
      .set(auth(member))
      .expect(404);
    await ctx
      .http()
      .delete(`/tasks/${taskId}/pull-requests/${manual.id as string}`)
      .set(auth(outsider))
      .expect(404);
    await ctx
      .http()
      .delete(`/tasks/${taskId}/pull-requests/${manual.id as string}`)
      .set(auth(guest))
      .expect(403);
    await ctx
      .http()
      .delete(`/tasks/${taskId}/pull-requests/${manual.id as string}`)
      .set(auth(member))
      .expect(204);
    await ctx
      .http()
      .delete(`/tasks/${taskId}/pull-requests/${manual.id as string}`)
      .set(auth(member))
      .expect(404);
    expect((await prs(member)).some(r => r.id === manual.id)).toBe(false);
    const activity = await ctx.http().get(`/tasks/${taskId}/activity`).set(auth(owner)).expect(200);
    const removed = activity.body.find((a: { action: string }) => a.action === 'task.pull_request_unlinked');
    expect(removed.diff.pullRequests).toEqual({ before: 'acme/rm#9', after: null });
  });

  it('lets guests with the list read the pull requests but never write, and hides them from other workspaces', async () => {
    expect((await prs(guest)).length).toBeGreaterThan(0);
    await link(guest, 'https://github.com/acme/g/pull/1').expect(403);
    await ctx.http().get(`/tasks/${taskId}/pull-requests`).set(auth(stranger)).expect(404);
    await ctx.http().get(`/tasks/${taskId}/pull-requests`).set(auth(outsider)).expect(404);
    await link(outsider, 'https://github.com/acme/x/pull/1').expect(404);
    await ctx.http().get('/tasks/nope/pull-requests').set(auth(member)).expect(404);
    expect((await prs(member)).some(r => r.repository === 'acme/g' || r.repository === 'acme/x')).toBe(false);
  });

  const upload = async (who: { token: string }, body: Record<string, unknown>) => {
    const req = await ctx.http().post(`/tasks/${taskId}/attachments`).set(auth(who)).send(body).expect(201);
    ctx.storage.objects.set(req.body.uploadUrl.split('/upload/')[1].split('?')[0], body.sizeBytes as number);
    await ctx
      .http()
      .post(`/attachments/${req.body.id as string}/confirm`)
      .set(auth(who))
      .expect(200);
    return req.body.id as string;
  };

  it('keeps a prints gallery of task images that guests with the list can view but not change', async () => {
    await ctx.http().post(`/tasks/${taskId}/attachments`).set(auth(member)).send({ filename: 'a.pdf', mimeType: 'application/pdf', sizeBytes: 10, gallery: 'prints' }).expect(400);
    await ctx.http().post(`/tasks/${taskId}/attachments`).set(auth(member)).send({ filename: 'a.html', mimeType: 'text/html', sizeBytes: 10, gallery: 'prints' }).expect(400);
    await ctx.http().post(`/tasks/${taskId}/attachments`).set(auth(member)).send({ filename: 'a.png', mimeType: 'image/png', sizeBytes: 10, gallery: 'banner' }).expect(400);
    const print = await upload(member, { filename: '01-tela.png', mimeType: 'image/png', sizeBytes: 12, gallery: 'prints' });
    const other = await upload(member, { filename: 'contrato.pdf', mimeType: 'application/pdf', sizeBytes: 12 });
    const gallery = await ctx.http().get(`/tasks/${taskId}/prints`).set(auth(member)).expect(200);
    expect(gallery.body.map((a: { id: string; gallery: string }) => [a.id, a.gallery])).toEqual([[print, 'prints']]);
    const all = await ctx.http().get(`/tasks/${taskId}/attachments`).set(auth(member)).expect(200);
    expect(all.body.find((a: { id: string }) => a.id === other).gallery).toBeNull();
    expect((await ctx.http().get(`/tasks/${taskId}/prints`).set(auth(guest)).expect(200)).body.map((a: { id: string }) => a.id)).toEqual([print]);
    await ctx.http().get(`/attachments/${print}/content`).set(auth(guest)).expect(302);
    await ctx.http().get(`/attachments/${other}/content`).set(auth(guest)).expect(404);
    await ctx.http().get(`/tasks/${taskId}/prints`).set(auth(stranger)).expect(404);
    await ctx.http().get(`/attachments/${print}/content`).set(auth(stranger)).expect(404);
    await ctx.http().get(`/tasks/${taskId}/prints`).set(auth(outsider)).expect(404);
    await ctx.http().post(`/tasks/${taskId}/attachments`).set(auth(guest)).send({ filename: 'g.png', mimeType: 'image/png', sizeBytes: 10, gallery: 'prints' }).expect(403);
    await ctx.http().delete(`/attachments/${print}`).set(auth(guest)).expect(403);
    await ctx.http().delete(`/attachments/${print}`).set(auth(member)).expect(204);
    expect((await ctx.http().get(`/tasks/${taskId}/prints`).set(auth(member)).expect(200)).body).toEqual([]);
  });
});
