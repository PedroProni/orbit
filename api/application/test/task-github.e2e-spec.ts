import { createHmac } from 'node:crypto';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { closeTestApp, createTestApp, TestContext } from './helpers/create-test-app';
import { GithubSyncService } from '../src/application/services/github-sync.service';
import { GithubPullRequest } from '../src/domain/types/github-pull-request.type';
import { PullRequestState } from '../src/domain/enums/pull-request-link.enums';

const API = 'PedroProni/orbit-api';
const WEB = 'PedroProni/orbit-frontend';
const SHA_OPEN = 'a'.repeat(40);
const SHA_MERGED = 'b'.repeat(40);
const SHA_COMMIT = 'c'.repeat(40);

describe('Task GitHub list, sync and refresh (e2e)', () => {
  let ctx: TestContext;
  let db: Connection;
  let sync: GithubSyncService;
  let owner: { token: string; id: string };
  let member: { token: string; id: string };
  let guest: { token: string; id: string };
  let stranger: { token: string; id: string };
  let outsider: { token: string; id: string };
  let taskId: string;
  let otherTaskId: string;
  const auth = (t: { token: string }) => ({ Authorization: `Bearer ${t.token}` });
  const view = async (who: { token: string }, id = taskId) => (await ctx.http().get(`/tasks/${id}/github`).set(auth(who)).expect(200)).body;
  const pr = (repository: string, number: number, extra: Partial<GithubPullRequest>): GithubPullRequest => ({
    repository,
    number,
    title: `PR ${number}`,
    body: '',
    url: `https://github.com/${repository}/pull/${number}`,
    state: PullRequestState.OPEN,
    draft: false,
    authorLogin: 'dev',
    authorAvatarUrl: 'https://avatars.githubusercontent.com/u/1',
    headRef: `feat/${number}`,
    headSha: SHA_OPEN,
    updatedAt: new Date('2026-11-08T10:00:00Z'),
    ...extra,
  });
  const signed = (event: string, payload: unknown, delivery: string) => {
    const body = JSON.stringify(payload);
    const signature = `sha256=${createHmac('sha256', 'whsec-test').update(body).digest('hex')}`;
    return ctx.http().post('/webhooks/github').set('Content-Type', 'application/json').set('X-GitHub-Event', event).set('X-GitHub-Delivery', delivery).set('X-Hub-Signature-256', signature).send(body);
  };
  const count = (collection: string, filter: Record<string, unknown>) => db.collection(collection).countDocuments(filter);
  const seed = () => {
    ctx.github.configured = true;
    ctx.github.pulls.set(API, [
      pr(API, 1, { title: 'Ajusta login', body: `Fecha ${taskId}`, headSha: SHA_OPEN }),
      pr(API, 2, { title: 'Corrige saldo', headRef: `fix/${taskId}`, headSha: SHA_MERGED, state: PullRequestState.MERGED, updatedAt: new Date('2026-11-07T10:00:00Z') }),
      pr(API, 3, { title: 'Sem tarefa', headSha: 'd'.repeat(40) }),
    ]);
    ctx.github.checkRuns.set(SHA_OPEN, [{ status: 'completed', conclusion: 'failure' }]);
    ctx.github.pullCommits.set(`${API}#1`, [{ sha: SHA_COMMIT, message: 'Primeiro commit\n\ndetalhe', url: '', authorLogin: 'dev', committedAt: new Date('2026-11-08T09:00:00Z') }]);
    ctx.github.branches.set(API, [
      { name: 'main', sha: SHA_COMMIT },
      { name: `feat/${taskId}-login`, sha: SHA_OPEN },
    ]);
    ctx.github.commits.set(WEB, [{ sha: 'e'.repeat(40), message: `Tela de login ${taskId.toUpperCase()}`, url: '', authorLogin: 'dev2', committedAt: new Date() }]);
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    db = ctx.app.get<Connection>(getConnectionToken());
    sync = ctx.app.get(GithubSyncService);
    owner = await ctx.login('owner@acme.test', 'Owner');
    member = await ctx.login('member@acme.test', 'Member');
    guest = await ctx.login('guest@acme.test', 'Guest', 'guest');
    stranger = await ctx.login('stranger@acme.test', 'Stranger', 'guest');
    outsider = await ctx.login('out@acme.test', 'Out', undefined, 'other');
    const tree = await ctx.http().get('/hierarchy').set(auth(owner)).expect(200);
    const list = await ctx.http().post(`/spaces/${tree.body[0].id}/lists`).set(auth(owner)).send({ name: 'L' }).expect(201);
    taskId = (await ctx.http().post(`/lists/${list.body.id}/tasks`).set(auth(owner)).send({ title: 'T' }).expect(201)).body.id;
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

  it('works as before without a token: empty list, refresh refused, manual link kept without calling GitHub', async () => {
    ctx.github.reset();
    expect(await view(member)).toEqual({ pullRequests: [], branches: [], commits: [], syncEnabled: false, syncedAt: null });
    await ctx.http().post(`/tasks/${taskId}/github/refresh`).set(auth(member)).expect(409);
    expect(await sync.syncAll()).toEqual([]);
    await ctx
      .http()
      .post(`/tasks/${otherTaskId}/pull-requests`)
      .set(auth(member))
      .send({ url: `https://github.com/${API}/pull/9` })
      .expect(201);
    expect(ctx.github.calls).toEqual([]);
  });

  it('links pull requests, branches and commits by the task id in body, branch and message, once per round', async () => {
    seed();
    const statusBefore = (await ctx.http().get(`/tasks/${taskId}`).set(auth(owner)).expect(200)).body.status;
    const reports = await sync.syncAll();
    expect(reports.find(r => r.repository === API)).toMatchObject({ pullRequests: 2, branches: 1 });
    const body = await view(member);
    expect(body.syncEnabled).toBe(true);
    expect(new Date(body.syncedAt).getTime()).toBeGreaterThan(Date.now() - 60000);
    const open = body.pullRequests.find((p: { number: number }) => p.number === 1);
    expect(open).toMatchObject({ repository: API, title: 'Ajusta login', state: 'open', source: 'sync', authorLogin: 'dev', checksState: 'failure', headRef: 'feat/1', draft: false });
    expect(body.pullRequests.find((p: { number: number }) => p.number === 2)).toMatchObject({ state: 'merged', checksState: null });
    expect(body.pullRequests).toHaveLength(2);
    expect(body.branches).toEqual([expect.objectContaining({ repository: API, kind: 'branch', key: `feat/${taskId}-login`, url: `https://github.com/${API}/tree/feat/${taskId}-login` })]);
    expect(body.commits.map((c: { key: string }) => c.key).sort()).toEqual([SHA_COMMIT, 'e'.repeat(40)]);
    expect(body.commits.find((c: { key: string }) => c.key === SHA_COMMIT)).toMatchObject({ title: 'Primeiro commit', authorLogin: 'dev' });
    await sync.syncAll();
    await sync.syncAll();
    expect(await count('pull_request_links', { task_id: taskId })).toBe(2);
    expect(await count('github_refs', { task_id: taskId })).toBe(3);
    const task = (await ctx.http().get(`/tasks/${taskId}`).set(auth(owner)).expect(200)).body;
    expect(task.status).toBe(statusBefore);
    const comments = await ctx.http().get(`/tasks/${taskId}/comments`).set(auth(owner)).expect(200);
    expect(comments.body).toEqual([]);
  });

  it('keeps one row per pull request and per ref when webhook, sync, refresh and manual link race', async () => {
    seed();
    ctx.github.pulls.set(API, [...(ctx.github.pulls.get(API) ?? []), pr(API, 40, { title: `Corrida ${otherTaskId}`, headSha: SHA_OPEN, updatedAt: new Date() })]);
    ctx.github.branches.set(API, [...(ctx.github.branches.get(API) ?? []), { name: `feat/${otherTaskId}`, sha: SHA_OPEN }]);
    await db.collection('github_sync_state').deleteMany({});
    const webhookBody = {
      action: 'opened',
      repository: { full_name: API },
      pull_request: {
        number: 40,
        title: `Corrida ${otherTaskId}`,
        html_url: `https://github.com/${API}/pull/40`,
        state: 'open',
        head: { ref: 'feat/40', sha: SHA_OPEN },
        updated_at: new Date().toISOString(),
      },
    };
    const results = await Promise.all([
      sync.syncAll(),
      sync.syncAll(),
      signed('pull_request', webhookBody, `race-${Date.now()}`),
      ctx.http().post(`/tasks/${otherTaskId}/pull-requests`).set(auth(member)).send({ url: `https://github.com/pedroproni/ORBIT-API/pull/40` }),
      ctx
        .http()
        .post(`/tasks/${otherTaskId}/pull-requests`)
        .set(auth(owner))
        .send({ url: `https://github.com/${API}/pull/40` }),
      ctx.http().post(`/tasks/${otherTaskId}/github/refresh`).set(auth(member)),
      signed('push', { ref: `refs/heads/feat/${otherTaskId}`, repository: { full_name: API }, commits: [{ id: SHA_COMMIT, message: `x ${otherTaskId}` }] }, `race-push-${Date.now()}`),
      signed('push', { ref: `refs/heads/feat/${otherTaskId}`, repository: { full_name: API }, commits: [{ id: SHA_COMMIT, message: `x ${otherTaskId}` }] }, `race-push2-${Date.now()}`),
    ]);
    expect(results.slice(2).every(r => [200, 201].includes((r as { status: number }).status))).toBe(true);
    const rows = await db.collection('pull_request_links').find({ task_id: otherTaskId, number: 40 }).toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0].repository).toBe(API);
    expect(await count('github_refs', { task_id: otherTaskId, key: SHA_COMMIT })).toBe(1);
    expect(await count('github_refs', { task_id: otherTaskId, key: `feat/${otherTaskId}` })).toBe(1);
    const dupes = await db
      .collection('github_refs')
      .aggregate([{ $group: { _id: { t: '$task_id', r: '$repository', k: '$kind', key: '$key' }, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }])
      .toArray();
    expect(dupes).toEqual([]);
  });

  it('lets a guest who can read the task see the list, hides it from others, and refuses refresh to guests', async () => {
    seed();
    const forGuest = await view(guest);
    expect(forGuest.pullRequests.length).toBeGreaterThan(0);
    await ctx.http().get(`/tasks/${taskId}/github`).set(auth(stranger)).expect(404);
    await ctx.http().get(`/tasks/${taskId}/github`).set(auth(outsider)).expect(404);
    await ctx.http().post(`/tasks/${taskId}/github/refresh`).set(auth(guest)).expect(403);
    await ctx.http().post(`/tasks/${taskId}/github/refresh`).set(auth(outsider)).expect(404);
  });

  it('refreshes one task from GitHub search at most once every 30 seconds', async () => {
    seed();
    await db.collection('github_sync_state').deleteMany({});
    ctx.github.pulls.set(WEB, [pr(WEB, 8, { title: `Nova tela ${taskId}`, headSha: SHA_OPEN, updatedAt: new Date() })]);
    ctx.github.calls = [];
    const first = await ctx.http().post(`/tasks/${taskId}/github/refresh`).set(auth(member)).expect(200);
    expect(first.body.pullRequests.map((p: { repository: string; number: number }) => `${p.repository}#${p.number}`)).toContain(`${WEB}#8`);
    expect(ctx.github.calls).toContain(`search ${taskId}`);
    const second = await ctx.http().post(`/tasks/${taskId}/github/refresh`).set(auth(owner)).expect(429);
    expect(second.body.code).toBe('GITHUB_REFRESH_COOLDOWN');
    const burst = await Promise.all(Array.from({ length: 5 }, () => ctx.http().post(`/tasks/${otherTaskId}/github/refresh`).set(auth(member))));
    expect(burst.filter(r => r.status === 200)).toHaveLength(1);
    expect(burst.filter(r => r.status === 429)).toHaveLength(4);
  });

  it('enriches a manual link only for listed repositories', async () => {
    seed();
    ctx.github.pulls.set('someone/private', [pr('someone/private', 5, { title: 'Segredo' })]);
    ctx.github.calls = [];
    const outside = await ctx.http().post(`/tasks/${taskId}/pull-requests`).set(auth(member)).send({ url: 'https://github.com/someone/private/pull/5' }).expect(201);
    expect(outside.body).toMatchObject({ title: '', state: null, authorLogin: null });
    expect(ctx.github.calls).toEqual([]);
    ctx.github.pulls.set(API, [...(ctx.github.pulls.get(API) ?? []), pr(API, 77, { title: 'Ligado à mão' })]);
    const listed = await ctx
      .http()
      .post(`/tasks/${taskId}/pull-requests`)
      .set(auth(member))
      .send({ url: `https://github.com/${API}/pull/77` })
      .expect(201);
    expect(listed.body).toMatchObject({ title: 'Ligado à mão', state: 'open', authorLogin: 'dev', checksState: 'failure', source: 'manual' });
  });

  it('applies checks events and drops a deleted branch, and a full round removes branches gone from GitHub', async () => {
    seed();
    await db.collection('github_sync_state').deleteMany({});
    await sync.syncAll();
    ctx.github.checkRuns.set(SHA_OPEN, [{ status: 'completed', conclusion: 'success' }]);
    await signed('check_suite', { action: 'completed', check_suite: { head_sha: SHA_OPEN }, repository: { full_name: API } }, `checks-${Date.now()}`).expect(200);
    expect((await view(member)).pullRequests.find((p: { number: number }) => p.number === 1).checksState).toBe('success');
    await signed('create', { ref: `spike/${taskId}`, ref_type: 'branch', repository: { full_name: API } }, `create-${Date.now()}`).expect(200);
    expect((await view(member)).branches.map((b: { key: string }) => b.key)).toContain(`spike/${taskId}`);
    await signed('delete', { ref: `spike/${taskId}`, ref_type: 'branch', repository: { full_name: API } }, `delete-${Date.now()}`).expect(200);
    expect((await view(member)).branches.map((b: { key: string }) => b.key)).not.toContain(`spike/${taskId}`);
    ctx.github.branches.set(API, [{ name: 'main', sha: SHA_COMMIT }]);
    await sync.syncAll();
    expect((await view(member)).branches).toEqual([]);
  });

  it('keeps a branch the webhook recorded after the branch listing of a round started', async () => {
    seed();
    await db.collection('github_sync_state').deleteMany({});
    ctx.github.branches.set(API, [{ name: 'main', sha: SHA_COMMIT }]);
    const original = ctx.github.listBranches.bind(ctx.github);
    ctx.github.listBranches = async (repository: string, page: number) => {
      const rows = await original(repository, page);
      if (repository === API) await signed('create', { ref: `late/${taskId}`, ref_type: 'branch', repository: { full_name: API } }, `late-${Date.now()}`).expect(200);
      return rows;
    };
    try {
      await sync.syncAll();
    } finally {
      ctx.github.listBranches = original;
    }
    expect((await view(member)).branches.map((b: { key: string }) => b.key)).toEqual([`late/${taskId}`]);
  });
});
