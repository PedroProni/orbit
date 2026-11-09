import { GithubHttpClient } from './github-http.client';
import { GithubError } from '@domain/errors/github.error';
import { PullRequestState } from '@domain/enums/pull-request-link.enums';

const TOKEN = 'github_pat_FAKE_TOKEN_VALUE_123';
const env = (token = TOKEN, url = '') => ({ getGithubToken: () => token, getGithubApiUrl: () => url || 'https://api.github.com' }) as never;
const reply = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(status === 304 ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

describe('GithubHttpClient', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as never;
  });

  it('calls the fixed host with the bearer token, maps the pull request and never follows redirects', async () => {
    fetchMock.mockResolvedValueOnce(
      reply(200, {
        number: 3,
        title: 'T',
        body: null,
        state: 'closed',
        merged_at: '2026-11-01T00:00:00Z',
        draft: false,
        user: { login: 'dev', avatar_url: 'a' },
        head: { ref: 'feat/x', sha: 'abc1234' },
        updated_at: '2026-11-02T00:00:00Z',
      }),
    );
    const pr = await new GithubHttpClient(env()).getPullRequest('PedroProni/orbit-api', 3);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/PedroProni/orbit-api/pulls/3');
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(init.redirect).toBe('error');
    expect(pr).toEqual(expect.objectContaining({ number: 3, state: PullRequestState.MERGED, authorLogin: 'dev', headSha: 'abc1234', body: '' }));
  });

  it('answers the cached body on 304 by sending If-None-Match', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, [{ name: 'main', commit: { sha: 'abc1234' } }], { etag: 'W/"e1"' })).mockResolvedValueOnce(reply(304, null));
    const client = new GithubHttpClient(env());
    await client.listBranches('PedroProni/orbit-api', 1);
    const second = await client.listBranches('PedroProni/orbit-api', 1);
    expect(fetchMock.mock.calls[1][1].headers['If-None-Match']).toBe('W/"e1"');
    expect(second).toEqual([{ name: 'main', sha: 'abc1234' }]);
  });

  it('pauses the core bucket once the remaining quota falls under the floor, without another request', async () => {
    const reset = Math.floor(Date.now() / 1000) + 600;
    fetchMock.mockResolvedValueOnce(reply(200, [], { 'x-ratelimit-remaining': '50', 'x-ratelimit-reset': String(reset) }));
    const client = new GithubHttpClient(env());
    await client.listBranches('PedroProni/orbit-api', 1);
    await expect(client.listBranches('PedroProni/orbit-api', 2)).rejects.toMatchObject({ code: 'GITHUB_RATE_LIMITED' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('turns 404 into null and other failures into an error that carries status and route but never the token', async () => {
    fetchMock
      .mockResolvedValueOnce(reply(404, {}))
      .mockResolvedValueOnce(reply(500, { message: `echo ${TOKEN}` }))
      .mockResolvedValueOnce(reply(403, {}, { 'x-ratelimit-remaining': '0' }));
    const client = new GithubHttpClient(env());
    expect(await client.getPullRequest('PedroProni/orbit-api', 9)).toBeNull();
    const failed = (await client.getPullRequest('PedroProni/orbit-api', 9).catch((error: GithubError) => error)) as GithubError;
    expect(failed).toBeInstanceOf(GithubError);
    expect(failed.message).toBe('GitHub pulls.get: GITHUB_REQUEST_FAILED (500)');
    const limited = (await client.getPullRequest('PedroProni/orbit-api', 9).catch((error: GithubError) => error)) as GithubError;
    expect(limited).toMatchObject({ code: 'GITHUB_RATE_LIMITED' });
    for (const error of [failed, limited]) expect(JSON.stringify({ message: error.message, stack: error.stack })).not.toContain(TOKEN);
  });

  it('refuses to read a missing or inaccessible repository as an empty list', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(reply(404, { message: 'Not Found' })));
    const client = new GithubHttpClient(env());
    const calls = [client.listPullRequests('PedroProni/orbit-api', 1), client.listBranches('PedroProni/orbit-api', 1), client.listCommits('PedroProni/orbit-api', new Date(0), 1)];
    const errors = (await Promise.all(calls.map(call => call.catch((error: GithubError) => error)))) as GithubError[];
    expect(errors.map(error => error.message)).toEqual([
      'GitHub pulls.list: GITHUB_REPOSITORY_UNAVAILABLE (404)',
      'GitHub branches.list: GITHUB_REPOSITORY_UNAVAILABLE (404)',
      'GitHub commits.list: GITHUB_REPOSITORY_UNAVAILABLE (404)',
    ]);
    expect(errors.every(error => error instanceof GithubError && error.code === 'GITHUB_REPOSITORY_UNAVAILABLE')).toBe(true);
    expect(await client.listPullRequestCommits('PedroProni/orbit-api', 9)).toEqual([]);
  });

  it('reports a timeout without leaking the request', async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error(`aborted ${TOKEN}`), { name: 'TimeoutError' }));
    const error = (await new GithubHttpClient(env()).listCommits('PedroProni/orbit-api', new Date(0), 1).catch((caught: GithubError) => caught)) as GithubError;
    expect(error).toMatchObject({ code: 'GITHUB_TIMEOUT', status: 502 });
    expect(error.message).not.toContain(TOKEN);
  });

  it('refuses without a token and refuses unsafe repository, sha and number values before any request', async () => {
    await expect(new GithubHttpClient(env('')).listBranches('PedroProni/orbit-api', 1)).rejects.toMatchObject({ code: 'GITHUB_NOT_CONFIGURED' });
    const client = new GithubHttpClient(env());
    await expect(client.listBranches('../../user', 1)).rejects.toBeInstanceOf(GithubError);
    await expect(client.listCheckRuns('PedroProni/orbit-api', 'main?x=1')).rejects.toBeInstanceOf(GithubError);
    await expect(client.getPullRequest('PedroProni/orbit-api', -1)).rejects.toBeInstanceOf(GithubError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('searches pull requests only in the listed repositories and only for a plain task id', async () => {
    fetchMock.mockResolvedValueOnce(
      reply(
        200,
        {
          items: [
            { number: 4, repository_url: 'https://api.github.com/repos/PedroProni/orbit-api', pull_request: {} },
            { number: 5, repository_url: 'https://api.github.com/repos/PedroProni/orbit-api' },
          ],
        },
        { 'x-ratelimit-remaining': '29', 'x-ratelimit-reset': '1' },
      ),
    );
    const client = new GithubHttpClient(env());
    expect(await client.searchPullRequests(['PedroProni/orbit-api', 'bad name'], '86abc1234')).toEqual([{ repository: 'PedroProni/orbit-api', number: 4 }]);
    expect(decodeURIComponent(fetchMock.mock.calls[0][0])).toContain('q=86abc1234+is:pr+repo:PedroProni/orbit-api');
    expect(await client.searchPullRequests(['PedroProni/orbit-api'], 'x repo:other/secret')).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses the configured base url', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { state: 'success', total_count: 1 }));
    expect(await new GithubHttpClient(env(TOKEN, 'http://127.0.0.1:55399')).getCombinedStatus('PedroProni/orbit-api', 'abc1234')).toEqual({ state: 'success', totalCount: 1 });
    expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:55399/repos/PedroProni/orbit-api/commits/abc1234/status');
  });
});
