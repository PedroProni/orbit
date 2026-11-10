// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import { PeoplePage } from '@/components/admin/people-page';
import { accessLinkUrl, accessStateOf, assignableRolesFor, canAdministerPerson, invitableRoles } from '@/components/admin/people.helpers';
import { ApiError } from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import { UserAccess } from '@/services/auth.types';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { useToastStore } from '@/stores/toast.store';
import { Principal } from '@/types/api.types';

const person = (id: string, role: string, extra: Partial<UserAccess> = {}): UserAccess => ({ id, email: `${id}@example.com`, name: id, avatarUrl: null, role, status: 'active', hasPassword: true, ...extra }) as UserAccess;
const me = (role: string): Principal => ({ id: 'me', email: 'me@example.com', name: 'me', avatarUrl: null, role, status: 'active', workspaceId: 'w1', scopes: [] }) as unknown as Principal;
const LINK = { token: 'segredo-do-link', kind: 'reset', expiresAt: '2026-11-06T11:00:00.000Z' } as const;
const PEOPLE = [person('me', 'owner'), person('adm', 'admin'), person('mem', 'member'), person('novo', 'member', { hasPassword: false }), person('off', 'guest', { status: 'disabled' }), person('lei', 'viewer')];

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

  it('lets an admin change a member to viewer from the row and shows the new role after the reload', async () => {
    const list = vi.spyOn(authService, 'userAccess').mockResolvedValue(PEOPLE);
    const change = vi.spyOn(authService, 'changeUserRole').mockResolvedValue({});
    await openAs('admin');
    const select = await screen.findByRole('combobox', { name: 'Role of mem' });
    fireEvent.click(select);
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Member', 'Viewer', 'Guest']);
    list.mockResolvedValue(PEOPLE.map((item) => (item.id === 'mem' ? { ...item, role: 'viewer' } : item)) as UserAccess[]);
    fireEvent.click(screen.getByRole('option', { name: 'Viewer' }));
    await waitFor(() => expect(change).toHaveBeenCalledWith('mem', 'viewer'));
    await waitFor(() => expect(useToastStore.getState().items.map((toast) => `${toast.kind}:${toast.messageKey}`)).toContain('success:roleChanged'));
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Role of mem' }).textContent).toContain('Viewer'));
  });

  it('gives an admin no role control over an admin, an owner or themselves', async () => {
    vi.spyOn(authService, 'userAccess').mockResolvedValue([...PEOPLE, person('me2', 'admin')]);
    vi.spyOn(orbitService, 'me').mockResolvedValue({ ...me('admin'), id: 'me2' });
    renderWithProviders(<PeoplePage />);
    expect(await screen.findByRole('combobox', { name: 'Role of lei' })).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: 'Role of adm' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Role of me' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Role of me2' })).toBeNull();
    expect(screen.getAllByText('Owner').length).toBeGreaterThan(0);
  });

  it('lets an owner promote to admin, never to owner, and shows the refusal toast when the server says no', async () => {
    vi.spyOn(authService, 'userAccess').mockResolvedValue(PEOPLE);
    const change = vi.spyOn(authService, 'changeUserRole').mockRejectedValue(new ApiError(403, 'Forbidden'));
    await openAs('owner');
    fireEvent.click(await screen.findByRole('combobox', { name: 'Role of lei' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Administrator', 'Member', 'Viewer', 'Guest']);
    fireEvent.click(screen.getByRole('option', { name: 'Administrator' }));
    await waitFor(() => expect(change).toHaveBeenCalledWith('lei', 'admin'));
    await waitFor(() => expect(useToastStore.getState().items.map((toast) => `${toast.kind}:${toast.messageKey}`)).toContain('error:roleChangeFailed'));
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

  it('invites a viewer with the hint that explains the role', async () => {
    vi.spyOn(authService, 'userAccess').mockResolvedValue(PEOPLE);
    const invite = vi.spyOn(authService, 'inviteUser').mockResolvedValue({ user: person('bia', 'viewer') as never, link: { ...LINK, kind: 'invite' } });
    await openAs('admin');
    fireEvent.click(await screen.findByRole('button', { name: 'Invite person' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'Bia' } });
    fireEvent.change(within(dialog).getByLabelText('Email'), { target: { value: 'bia@example.com' } });
    chooseOption(within(dialog).getByRole('combobox', { name: 'What this person can do' }), 'Viewer');
    expect(within(dialog).getByText('Sees everything a member sees, names included, but cannot change anything.')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create invite' }));
    await waitFor(() => expect(invite).toHaveBeenCalledWith({ email: 'bia@example.com', name: 'Bia', role: 'viewer', allowExternalEmail: false }));
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
    expect(canAdministerPerson('me', 'admin', person('v', 'viewer'))).toBe(true);
    expect(canAdministerPerson('me', 'viewer', person('g', 'guest'))).toBe(false);
  });

  it('offers only the roles this person may give', () => {
    expect(invitableRoles('owner')).toEqual(['admin', 'member', 'viewer', 'guest']);
    expect(invitableRoles('admin')).toEqual(['member', 'viewer', 'guest']);
    expect(invitableRoles('member')).toEqual([]);
    expect(invitableRoles('viewer')).toEqual([]);
  });

  it('lets an admin move a person only among member, viewer and guest, and never touches an owner', () => {
    expect(assignableRolesFor('admin', person('m', 'member'))).toEqual(['member', 'viewer', 'guest']);
    expect(assignableRolesFor('owner', person('a', 'admin'))).toEqual(['admin', 'member', 'viewer', 'guest']);
    expect(assignableRolesFor('owner', person('o', 'owner'))).toEqual([]);
    expect(assignableRolesFor('viewer', person('m', 'member'))).toEqual([]);
  });

  it('reads the state and builds a link that keeps the token out of the server logs', () => {
    expect(accessStateOf(person('a', 'member', { status: 'disabled', hasPassword: true }))).toBe('disabled');
    expect(accessStateOf(person('a', 'member', { hasPassword: false }))).toBe('pending');
    expect(accessStateOf(person('a', 'member'))).toBe('active');
    expect(accessLinkUrl('https://orbit.test', 'abc')).toBe('https://orbit.test/set-password#token=abc');
  });
});
