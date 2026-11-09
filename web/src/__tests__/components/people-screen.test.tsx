// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { PeoplePage } from '@/components/admin/people-page';
import { accessLinkUrl, accessStateOf, canAdministerPerson, invitableRoles } from '@/components/admin/people.helpers';
import { ApiError } from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import { UserAccess } from '@/services/auth.types';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { Principal } from '@/types/api.types';

const person = (id: string, role: string, extra: Partial<UserAccess> = {}): UserAccess => ({ id, email: `${id}@example.com`, name: id, avatarUrl: null, role, status: 'active', hasPassword: true, ...extra }) as UserAccess;
const me = (role: string): Principal => ({ id: 'me', email: 'me@example.com', name: 'me', avatarUrl: null, role, status: 'active', workspaceId: 'w1', scopes: [] }) as unknown as Principal;
const LINK = { token: 'segredo-do-link', kind: 'reset', expiresAt: '2026-11-06T11:00:00.000Z' } as const;
const PEOPLE = [person('me', 'owner'), person('adm', 'admin'), person('mem', 'member'), person('novo', 'member', { hasPassword: false }), person('off', 'guest', { status: 'disabled' })];

const openAs = async (role: string) => {
  vi.spyOn(orbitService, 'me').mockResolvedValue(me(role));
  renderWithProviders(<PeoplePage />);
};

describe('people screen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
  });
  afterEach(() => cleanup());

  it.each(['member', 'guest'])('refuses a %s by URL and never asks for the list', async (role) => {
    const list = vi.spyOn(authService, 'userAccess').mockResolvedValue(PEOPLE);
    await openAs(role);
    expect(await screen.findByText('Only owners and administrators manage people.')).toBeTruthy();
    expect(list).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Invite person' })).toBeNull();
  });

  it('shows state in plain words and only the actions this person can do', async () => {
    vi.spyOn(authService, 'userAccess').mockResolvedValue(PEOPLE);
    await openAs('admin');
    expect((await screen.findAllByText('Has a password')).length).toBeGreaterThan(0);
    expect(screen.getByText('Invite pending')).toBeTruthy();
    expect(screen.getByText('Disabled')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New password link for mem' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New invite link for novo' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'New password link for me' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'New password link for adm' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'New password link for off' })).toBeNull();
    expect(screen.getByRole('button', { name: 'End every session of off' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'End every session of mem' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'End every session of me' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'End every session of adm' })).toBeNull();
  });

  it('shows the link once and forgets it when closed', async () => {
    vi.spyOn(authService, 'userAccess').mockResolvedValue(PEOPLE);
    const generate = vi.spyOn(authService, 'generateAccessLink').mockResolvedValue(LINK);
    await openAs('owner');
    fireEvent.click(await screen.findByRole('button', { name: 'New password link for mem' }));
    const field = (await screen.findByLabelText('Link for this person')) as HTMLInputElement;
    expect(field.value).toBe(`${window.location.origin}/set-password#token=segredo-do-link`);
    expect(generate.mock.calls[0]?.[0]).toBe('mem');
    expect(within(screen.getByRole('dialog')).getByText(/It works once/)).toBeTruthy();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByLabelText('Link for this person')).toBeNull());
    expect(document.body.innerHTML).not.toContain('segredo-do-link');
  });

  it('copies the link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { clipboard: { writeText } }));
    vi.spyOn(authService, 'userAccess').mockResolvedValue(PEOPLE);
    vi.spyOn(authService, 'generateAccessLink').mockResolvedValue(LINK);
    await openAs('owner');
    fireEvent.click(await screen.findByRole('button', { name: 'New password link for mem' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/set-password#token=segredo-do-link`);
    vi.unstubAllGlobals();
  });

  it('shows the refusal when the server does not allow the link', async () => {
    vi.spyOn(authService, 'userAccess').mockResolvedValue(PEOPLE);
    vi.spyOn(authService, 'generateAccessLink').mockRejectedValue(new ApiError(403, 'ACCESS_NOT_ALLOWED'));
    await openAs('owner');
    fireEvent.click(await screen.findByRole('button', { name: 'New password link for mem' }));
    expect((await screen.findByRole('alert')).textContent).toBe('You are not allowed to do this for this person.');
    expect(screen.queryByLabelText('Link for this person')).toBeNull();
  });

  it('ends the sessions of a person', async () => {
    vi.spyOn(authService, 'userAccess').mockResolvedValue(PEOPLE);
    const revoke = vi.spyOn(authService, 'revokeUserSessions').mockResolvedValue({ revoked: 2 });
    await openAs('owner');
    fireEvent.click(await screen.findByRole('button', { name: 'End every session of mem' }));
    await waitFor(() => expect(revoke.mock.calls[0]?.[0]).toBe('mem'));
  });

  it('invites a person and hands over the link', async () => {
    vi.spyOn(authService, 'userAccess').mockResolvedValue(PEOPLE);
    const invite = vi.spyOn(authService, 'inviteUser').mockResolvedValue({ user: person('ana', 'guest') as never, link: { ...LINK, kind: 'invite' } });
    await openAs('admin');
    fireEvent.click(await screen.findByRole('button', { name: 'Invite person' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'Ana' } });
    fireEvent.change(within(dialog).getByLabelText('Email'), { target: { value: 'ana@example.com' } });
    chooseOption(within(dialog).getByRole('combobox', { name: 'What this person can do' }), 'Guest');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create invite' }));
    expect(((await screen.findByLabelText('Link for this person')) as HTMLInputElement).value).toContain('segredo-do-link');
    expect(invite).toHaveBeenCalledWith({ email: 'ana@example.com', name: 'Ana', role: 'guest', allowExternalEmail: false });
    expect(screen.getByText(/Send it privately to Ana/)).toBeTruthy();
  });

  it('draws both dialogs on their own opaque panel so the list behind does not show through', async () => {
    vi.spyOn(authService, 'userAccess').mockResolvedValue(PEOPLE);
    vi.spyOn(authService, 'generateAccessLink').mockResolvedValue(LINK);
    await openAs('owner');
    fireEvent.click(await screen.findByRole('button', { name: 'Invite person' }));
    expect((await screen.findByRole('dialog')).className).toContain('bg-raised');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(await screen.findByRole('button', { name: 'New password link for mem' }));
    expect((await screen.findByRole('dialog')).className).toContain('bg-raised');
    expect((screen.getByLabelText('Link for this person') as HTMLTextAreaElement).tagName).toBe('TEXTAREA');
  });

  it('explains an email outside the company and keeps what was typed', async () => {
    vi.spyOn(authService, 'userAccess').mockResolvedValue(PEOPLE);
    vi.spyOn(authService, 'inviteUser').mockRejectedValue(new ApiError(403, 'EMAIL_DOMAIN_NOT_ALLOWED'));
    await openAs('owner');
    fireEvent.click(await screen.findByRole('button', { name: 'Invite person' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'Ana' } });
    fireEvent.change(within(dialog).getByLabelText('Email'), { target: { value: 'ana@fora.com' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create invite' }));
    expect((await within(dialog).findByRole('alert')).textContent).toContain('outside the company domain');
    expect((within(dialog).getByLabelText('Email') as HTMLInputElement).value).toBe('ana@fora.com');
  });

  it('shows the load failure and the empty list', async () => {
    vi.spyOn(authService, 'userAccess').mockRejectedValue(new ApiError(500, 'boom'));
    await openAs('owner');
    expect(await screen.findByText('Could not load the people.')).toBeTruthy();
    cleanup();
    vi.spyOn(authService, 'userAccess').mockResolvedValue([]);
    await openAs('owner');
    expect(await screen.findByText('No people yet.')).toBeTruthy();
  });
});

describe('people rules', () => {
  it('matches the server: an admin handles only lower roles, an owner everyone but themselves', () => {
    expect(canAdministerPerson('me', 'admin', person('m', 'member'))).toBe(true);
    expect(canAdministerPerson('me', 'admin', person('g', 'guest'))).toBe(true);
    expect(canAdministerPerson('me', 'admin', person('a', 'admin'))).toBe(false);
    expect(canAdministerPerson('me', 'admin', person('o', 'owner'))).toBe(false);
    expect(canAdministerPerson('me', 'owner', person('o', 'owner'))).toBe(true);
    expect(canAdministerPerson('me', 'owner', person('me', 'owner'))).toBe(false);
    expect(canAdministerPerson('me', 'member', person('g', 'guest'))).toBe(false);
  });

  it('offers only the roles this person may give', () => {
    expect(invitableRoles('owner')).toEqual(['admin', 'member', 'guest']);
    expect(invitableRoles('admin')).toEqual(['member', 'guest']);
    expect(invitableRoles('member')).toEqual([]);
  });

  it('reads the state and builds a link that keeps the token out of the server logs', () => {
    expect(accessStateOf(person('a', 'member', { status: 'disabled', hasPassword: true }))).toBe('disabled');
    expect(accessStateOf(person('a', 'member', { hasPassword: false }))).toBe('pending');
    expect(accessStateOf(person('a', 'member'))).toBe('active');
    expect(accessLinkUrl('https://orbit.test', 'abc')).toBe('https://orbit.test/set-password#token=abc');
  });
});
