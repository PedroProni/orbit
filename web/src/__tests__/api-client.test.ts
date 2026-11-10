import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, toQuery } from '@/lib/api-client';

const LEGACY_TOKEN = 'token-antigo-no-navegador';

const stubBrowser = (pathname: string) => {
  const assign = vi.fn();
  vi.stubGlobal('window', { location: { pathname, assign }, localStorage: { getItem: () => LEGACY_TOKEN, removeItem: vi.fn() } });
  return assign;
};

const stubFetch = (status: number, body: unknown = {}) => {
  const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const sentHeaders = (fetchMock: ReturnType<typeof stubFetch>) => new Headers(fetchMock.mock.calls[0][1].headers);

describe('api client transport', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the CSRF header on every call', async () => {
    stubBrowser('/tasks');
    const fetchMock = stubFetch(200);
    await api('/auth/me');
    expect(sentHeaders(fetchMock).get('x-orbit-csrf')).toBe('1');
    expect(fetchMock.mock.calls[0][0]).toBe('/backend/auth/me');
  });

  it('keeps the session in the same-origin cookie', async () => {
    stubBrowser('/tasks');
    const fetchMock = stubFetch(200);
    await api('/auth/me');
    expect(fetchMock.mock.calls[0][1].credentials).toBe('same-origin');
  });

  it('never sends a token kept in the browser', async () => {
    stubBrowser('/tasks');
    const fetchMock = stubFetch(200);
    await api('/auth/me');
    expect(sentHeaders(fetchMock).has('Authorization')).toBe(false);
  });

  it('sends the CSRF header even when the caller passes its own headers', async () => {
    stubBrowser('/tasks');
    const fetchMock = stubFetch(200);
    await api('/tasks', { method: 'POST', body: '{}', headers: { 'X-Outro': 'sim' } });
    const headers = sentHeaders(fetchMock);
    expect(headers.get('x-orbit-csrf')).toBe('1');
    expect(headers.get('X-Outro')).toBe('sim');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('sends a logged-out person to the login page from a private screen', async () => {
    const assign = stubBrowser('/tasks');
    stubFetch(401, { message: 'Unauthorized' });
    await expect(api('/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it.each(['/login', '/forgot-password', '/set-password', '/f/chave-publica'])('stays on the public screen %s after a 401', async (pathname) => {
    const assign = stubBrowser(pathname);
    stubFetch(401, { message: 'Unauthorized' });
    await expect(api('/auth/login', { method: 'POST', body: '{}' })).rejects.toMatchObject({ status: 401 });
    expect(assign).not.toHaveBeenCalled();
  });

  it('does not redirect on a refusal that is not a 401', async () => {
    const assign = stubBrowser('/tasks');
    stubFetch(403, { message: 'Forbidden' });
    await expect(api('/users/invite', { method: 'POST', body: '{}' })).rejects.toMatchObject({ status: 403, message: 'Forbidden' });
    expect(assign).not.toHaveBeenCalled();
  });
});

describe('api client answers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('declares JSON only when there is a body, and respects the type the caller chose', async () => {
    stubBrowser('/tasks');
    const fetchMock = stubFetch(200);
    await api('/tasks');
    expect(sentHeaders(fetchMock).has('Content-Type')).toBe(false);
    fetchMock.mockClear();
    await api('/tasks', { method: 'POST', body: '{}' });
    expect(sentHeaders(fetchMock).get('Content-Type')).toBe('application/json');
    fetchMock.mockClear();
    await api('/tasks', { method: 'POST', body: 'x', headers: { 'Content-Type': 'text/plain' } });
    expect(sentHeaders(fetchMock).get('Content-Type')).toBe('text/plain');
  });

  it('runs on the server, where there is no window, without trying to redirect', async () => {
    stubFetch(401, { message: 'Unauthorized' });
    await expect(api('/auth/me')).rejects.toBeInstanceOf(ApiError);
  });

  it('joins a list of messages from the server', async () => {
    stubBrowser('/tasks');
    stubFetch(400, { message: ['um', 'dois'] });
    await expect(api('/tasks')).rejects.toMatchObject({ status: 400, message: 'um, dois' });
  });

  it('falls back to the status text when the server sends no message', async () => {
    stubBrowser('/tasks');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('sem json', { status: 502, statusText: 'Bad Gateway' })));
    await expect(api('/tasks')).rejects.toMatchObject({ status: 502, message: 'Bad Gateway' });
  });

  it('reads JSON, an empty answer and a 204', async () => {
    stubBrowser('/tasks');
    stubFetch(200, { id: 1 });
    await expect(api('/tasks')).resolves.toEqual({ id: 1 });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));
    await expect(api('/tasks')).resolves.toBeUndefined();
    const text = vi.fn(async () => '{"nao":"ler"}');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 204, text }) as unknown as Response));
    await expect(api('/tasks')).resolves.toBeUndefined();
    expect(text).not.toHaveBeenCalled();
  });

  it('builds the query string without the empty values', () => {
    expect(toQuery({})).toBe('');
    expect(toQuery({ a: undefined, b: null, c: '', d: [] })).toBe('');
    expect(toQuery({ a: 0, b: false })).toBe('?a=0&b=false');
    expect(toQuery({ a: ['x', 'y'], b: 'z' })).toBe('?a=x%2Cy&b=z');
  });
});
