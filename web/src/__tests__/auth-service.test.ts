import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/services/auth.service';
import { orbitService } from '@/services/orbit.service';

const mocks = vi.hoisted(() => ({ api: vi.fn() }));

vi.mock('@/lib/api-client', () => ({ api: mocks.api }));

const INVITE = { email: 'ana@example.com', name: 'Ana', role: 'member', allowExternalEmail: false };

const CALLS: [string, () => unknown, string, string | undefined, unknown][] = [
  ['login', () => authService.login('ana@example.com', 'uma-senha-longa'), '/auth/login', 'POST', { email: 'ana@example.com', password: 'uma-senha-longa' }],
  ['logout', () => authService.logout(), '/auth/logout', 'POST', undefined],
  ['forgotPassword', () => authService.forgotPassword('ana@example.com'), '/auth/password/forgot', 'POST', { email: 'ana@example.com' }],
  ['checkLink', () => authService.checkLink('abc'), '/auth/password/link', 'POST', { token: 'abc' }],
  ['setPassword', () => authService.setPassword('abc', 'uma-senha-longa'), '/auth/password/set', 'POST', { token: 'abc', password: 'uma-senha-longa' }],
  ['changePassword', () => authService.changePassword('senha-atual', 'senha-nova'), '/auth/password/change', 'POST', { currentPassword: 'senha-atual', newPassword: 'senha-nova' }],
  ['sessions', () => authService.sessions(), '/auth/sessions', undefined, undefined],
  ['revokeSession', () => authService.revokeSession('s1'), '/auth/sessions/s1', 'DELETE', undefined],
  ['revokeOtherSessions', () => authService.revokeOtherSessions(), '/auth/sessions/revoke-others', 'POST', undefined],
  ['userAccess', () => authService.userAccess(), '/users/access', undefined, undefined],
  ['inviteUser', () => authService.inviteUser(INVITE), '/users/invite', 'POST', INVITE],
  ['generateAccessLink', () => authService.generateAccessLink('u1'), '/users/u1/access-link', 'POST', undefined],
  ['changeUserRole', () => authService.changeUserRole('u1', 'viewer'), '/users/u1/role', 'PATCH', { role: 'viewer' }],
  ['revokeUserSessions', () => authService.revokeUserSessions('u1'), '/users/u1/sessions', 'DELETE', undefined],
];

describe('auth service routes', () => {
  beforeEach(() => {
    mocks.api.mockReset();
  });

  it('covers every call the service offers', () => {
    expect(CALLS.map(([name]) => name).sort()).toEqual(Object.keys(authService).sort());
  });

  it.each(CALLS)('%s calls the route the API answers on', (_name, call, path, method, body) => {
    call();
    expect(mocks.api).toHaveBeenCalledTimes(1);
    const [sentPath, init] = mocks.api.mock.calls[0];
    expect(sentPath).toBe(path);
    expect(init?.method).toBe(method);
    expect(init?.body ? JSON.parse(init.body) : undefined).toEqual(body);
  });

  it('asks the server who is signed in on the route the session check uses', () => {
    orbitService.me();
    expect(mocks.api.mock.calls[0][0]).toBe('/auth/me');
  });
});
