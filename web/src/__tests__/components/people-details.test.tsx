// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { chooseOption } from '../helpers/choose-option';
import AdminPeoplePage from '@/app/(app)/admin/people/page';
import { AccessLinkDialog } from '@/components/admin/access-link-dialog';
import { PeoplePage } from '@/components/admin/people-page';
import { ApiError } from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import { UserAccess } from '@/services/auth.types';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { useToastStore } from '@/stores/toast.store';
import { Principal } from '@/types/api.types';

const person = (id: string, role: string, extra: Partial<UserAccess> = {}): UserAccess => ({ id, email: `${id}@example.com`, name: id, avatarUrl: null, role, status: 'active', hasPassword: true, ...extra }) as UserAccess;
const me = (role: string): Principal => ({ id: 'me', email: 'me@example.com', name: 'me', avatarUrl: null, role, status: 'active', workspaceId: 'w1', scopes: [] }) as unknown as Principal;
const PEOPLE = [person('me', 'owner'), person('mem', 'member'), person('novo', 'member', { hasPassword: false })];
const LINK = { token: 'segredo-do-link', kind: 'reset', expiresAt: '2026-11-06T11:00:00.000Z' } as const;
const INVITE_LINK = { ...LINK, kind: 'invite' } as const;
const DENIED = 'Only owners and administrators manage people.';

const never = <T,>() => new Promise<T>(() => undefined);
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
const toasts = () => useToastStore.getState().items.map((toast) => `${toast.kind}:${toast.messageKey}`);

const open = (role = 'owner', people: UserAccess[] = PEOPLE) => {
  vi.spyOn(orbitService, 'me').mockResolvedValue(me(role));
  const list = vi.spyOn(authService, 'userAccess').mockResolvedValue(people);
  renderWithProviders(<PeoplePage />);
  return list;
};

const openInvite = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Invite person' }));
  return screen.findByRole('dialog');
};

const fillInvite = (dialog: HTMLElement, name = 'Ana', email = 'ana@example.com') => {
  fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: name } });
  fireEvent.change(within(dialog).getByLabelText('Email'), { target: { value: email } });
};

describe('people screen details', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    useToastStore.setState({ items: [] });
  });
  afterEach(() => cleanup());

  it('opens the screen from its route', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(me('member'));
    renderWithProviders(<AdminPeoplePage />);
    expect(await screen.findByText(DENIED)).toBeTruthy();
    expect(screen.getByText('You do not have access to this page')).toBeTruthy();
  });

  it('shows neither the refusal nor the screen while it does not know who is asking', () => {
    vi.spyOn(orbitService, 'me').mockReturnValue(never());
    const { container } = renderWithProviders(<PeoplePage />);
    expect(container.querySelector('.skeleton')).not.toBeNull();
    expect(screen.queryByText(DENIED)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Invite person' })).toBeNull();
  });

  it('shows a placeholder while the list loads and only that', async () => {
    vi.spyOn(orbitService, 'me').mockResolvedValue(me('owner'));
    vi.spyOn(authService, 'userAccess').mockReturnValue(never());
    const { container } = renderWithProviders(<PeoplePage />);
    await screen.findByRole('button', { name: 'Invite person' });
    expect(container.querySelector('.skeleton')).not.toBeNull();
    expect(screen.queryByText('No people yet.')).toBeNull();
    expect(screen.queryByText('Could not load the people.')).toBeNull();
  });

  it('shows the loaded list with no placeholder, no empty message, no error and no refusal', async () => {
    open();
    await screen.findByRole('button', { name: 'New password link for mem' });
    expect(document.querySelector('.skeleton')).toBeNull();
    expect(screen.queryByText('No people yet.')).toBeNull();
    expect(screen.queryByText('Could not load the people.')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('says it in words on each row', async () => {
    open();
    expect((await screen.findByRole('button', { name: 'New password link for mem' })).textContent).toBe('New password link');
    expect(button('New invite link for novo').textContent).toBe('New invite link');
    expect(button('End every session of mem').textContent).toBe('End sessions');
    expect(screen.getAllByText('Member').length).toBeGreaterThan(0);
  });

  it('warns and removes the old refusal when the next link works', async () => {
    open();
    const generate = vi.spyOn(authService, 'generateAccessLink').mockRejectedValueOnce(new ApiError(403, 'ACCESS_NOT_ALLOWED'));
    fireEvent.click(await screen.findByRole('button', { name: 'New password link for mem' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(toasts()).toContain('error:accessLinkFailed');
    generate.mockResolvedValue(LINK);
    fireEvent.click(button('New password link for mem'));
    await screen.findByLabelText('Link for this person');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('blocks every row action while a link is being made', async () => {
    open();
    vi.spyOn(authService, 'generateAccessLink').mockReturnValue(never());
    fireEvent.click(await screen.findByRole('button', { name: 'New password link for mem' }));
    await waitFor(() => expect(button('New password link for mem').disabled).toBe(true));
    expect(button('End every session of mem').disabled).toBe(true);
    expect(button('New invite link for novo').disabled).toBe(true);
  });

  it('blocks every row action while sessions are ending', async () => {
    open();
    vi.spyOn(authService, 'revokeUserSessions').mockReturnValue(never());
    fireEvent.click(await screen.findByRole('button', { name: 'End every session of mem' }));
    await waitFor(() => expect(button('End every session of mem').disabled).toBe(true));
    expect(button('New password link for mem').disabled).toBe(true);
  });

  it('reports the end of the sessions of a person, good or bad', async () => {
    open();
    const revoke = vi.spyOn(authService, 'revokeUserSessions').mockResolvedValueOnce({ revoked: 1 });
    fireEvent.click(await screen.findByRole('button', { name: 'End every session of mem' }));
    await waitFor(() => expect(toasts()).toContain('success:sessionsEnded'));
    revoke.mockRejectedValue(new ApiError(403, 'x'));
    fireEvent.click(button('End every session of mem'));
    await waitFor(() => expect(toasts()).toContain('error:sessionRevokeFailed'));
  });
});

describe('invite dialog details', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    useToastStore.setState({ items: [] });
  });
  afterEach(() => cleanup());

  it('invites as a member by default, inside the company, then closes and reads the list again', async () => {
    const list = open();
    const invite = vi.spyOn(authService, 'inviteUser').mockResolvedValue({ user: person('ana', 'member') as never, link: INVITE_LINK });
    const dialog = await openInvite();
    expect(within(dialog).getByText('Creates and edits tasks, comments and files.')).toBeTruthy();
    expect(within(dialog).queryByRole('alert')).toBeNull();
    fillInvite(dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create invite' }));
    expect(await screen.findByLabelText('Link for this person')).toBeTruthy();
    expect(invite.mock.calls[0]?.[0]).toEqual({ email: 'ana@example.com', name: 'Ana', role: 'member', allowExternalEmail: false });
    await waitFor(() => expect(screen.queryByLabelText('Name')).toBeNull());
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });

  it('sends the override only when ticked and shows the rule of the chosen role', async () => {
    open();
    const invite = vi.spyOn(authService, 'inviteUser').mockResolvedValue({ user: person('ana', 'guest') as never, link: INVITE_LINK });
    const dialog = await openInvite();
    fillInvite(dialog, 'Ana', 'ana@fora.com');
    chooseOption(within(dialog).getByRole('combobox', { name: 'What this person can do' }), 'Guest');
    expect(within(dialog).getByRole('combobox', { name: 'What this person can do' }).textContent).toContain('Guest');
    expect(within(dialog).getByText('Only reads the lists shared with them.')).toBeTruthy();
    fireEvent.click(within(dialog).getByLabelText('Allow an email outside the company domain. This is recorded in the audit log.'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create invite' }));
    await waitFor(() => expect(invite).toHaveBeenCalledTimes(1));
    expect(invite.mock.calls[0]?.[0]).toEqual({ email: 'ana@fora.com', name: 'Ana', role: 'guest', allowExternalEmail: true });
  });

  it('refuses empty fields on the screen', async () => {
    open();
    const invite = vi.spyOn(authService, 'inviteUser').mockResolvedValue({ user: person('ana', 'member') as never, link: INVITE_LINK });
    const dialog = await openInvite();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create invite' }));
    expect(await within(dialog).findByText('Name is required')).toBeTruthy();
    expect(within(dialog).getByText('Enter a valid email')).toBeTruthy();
    expect(invite).not.toHaveBeenCalled();
  });

  it('blocks a second click and removes the old error on the next try', async () => {
    open();
    const invite = vi.spyOn(authService, 'inviteUser').mockRejectedValueOnce(new ApiError(409, 'USER_EXISTS'));
    const dialog = await openInvite();
    fillInvite(dialog);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create invite' }));
    expect(await within(dialog).findByRole('alert')).toBeTruthy();
    invite.mockReturnValue(never());
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create invite' }));
    await waitFor(() => expect(within(dialog).queryByRole('alert')).toBeNull());
    await waitFor(() => expect((within(dialog).getByRole('button', { name: 'Create invite' }) as HTMLButtonElement).disabled).toBe(true));
  });

  it('forgets everything typed when closed', async () => {
    open();
    vi.spyOn(authService, 'inviteUser').mockRejectedValue(new ApiError(409, 'USER_EXISTS'));
    const dialog = await openInvite();
    fillInvite(dialog);
    chooseOption(within(dialog).getByRole('combobox', { name: 'What this person can do' }), 'Guest');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create invite' }));
    expect(await within(dialog).findByRole('alert')).toBeTruthy();
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Close' }).at(-1) as HTMLElement);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const reopened = await openInvite();
    expect((within(reopened).getByLabelText('Name') as HTMLInputElement).value).toBe('');
    expect((within(reopened).getByLabelText('Email') as HTMLInputElement).value).toBe('');
    expect(within(reopened).getByRole('combobox', { name: 'What this person can do' }).textContent).toContain('Member');
    expect(within(reopened).queryByRole('alert')).toBeNull();
  });
});

describe('access link dialog details', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  it('uses the words of a password reset', () => {
    renderWithProviders(<AccessLinkDialog name="Ana" link={LINK} onClose={vi.fn()} />);
    expect(screen.getByText('Send it privately to Ana so they can choose a new password.')).toBeTruthy();
    expect((screen.getByLabelText('Link for this person') as HTMLTextAreaElement).readOnly).toBe(true);
  });

  it('uses the words of an invite', () => {
    renderWithProviders(<AccessLinkDialog name="Ana" link={INVITE_LINK} onClose={vi.fn()} />);
    expect(screen.getByText('Send it privately to Ana so they can create a password.')).toBeTruthy();
  });

  it('forgets it was copied when closed', async () => {
    vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } }));
    const onClose = vi.fn();
    renderWithProviders(<AccessLinkDialog name="Ana" link={LINK} onClose={onClose} />);
    await act(async () => {
      fireEvent.click(button('Copy'));
    });
    expect(button('Copied')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' }).at(-1) as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Copied' })).toBeNull();
    vi.unstubAllGlobals();
  });
});
