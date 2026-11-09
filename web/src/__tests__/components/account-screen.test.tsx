// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render-with-providers';
import { ChangePasswordForm } from '@/components/account/change-password-form';
import { describeDevice } from '@/components/account/device.helpers';
import { SessionsList } from '@/components/account/sessions-list';
import { ApiError } from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import { useSessionStore } from '@/stores/session.store';
import { useToastStore } from '@/stores/toast.store';

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));

const CHROME = 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
const SESSIONS = [
  { id: 's1', ip: '10.0.0.1', userAgent: CHROME, createdAt: '2026-11-06T10:00:00.000Z', expiresAt: '2026-11-13T10:00:00.000Z', current: true },
  { id: 's2', ip: null, userAgent: null, createdAt: '2026-11-05T10:00:00.000Z', expiresAt: '2026-11-12T10:00:00.000Z', current: false },
];

const fillChange = (current: string, next: string, confirm = next) => {
  fireEvent.change(screen.getByLabelText('Current password'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('Repeat the password'), { target: { value: confirm } });
  fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
};

describe('change password', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useToastStore.setState({ items: [] });
  });
  afterEach(() => cleanup());

  it('changes the password, clears the fields and warns about the other sessions', async () => {
    const change = vi.spyOn(authService, 'changePassword').mockResolvedValue({ revoked: 2 });
    renderWithProviders(<ChangePasswordForm />);
    fillChange('senha-atual-longa', 'senha-nova-longa');
    await waitFor(() => expect(change).toHaveBeenCalledWith('senha-atual-longa', 'senha-nova-longa'));
    await waitFor(() => expect((screen.getByLabelText('Current password') as HTMLInputElement).value).toBe(''));
    expect(useToastStore.getState().items.map((toast) => toast.messageKey)).toContain('passwordChanged');
  });

  it('refreshes the sessions list after the change, since the others have ended', async () => {
    const sessions = vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    vi.spyOn(authService, 'changePassword').mockResolvedValue({ revoked: 1 });
    renderWithProviders(
      <>
        <SessionsList />
        <ChangePasswordForm />
      </>,
    );
    await waitFor(() => expect(sessions).toHaveBeenCalledTimes(1));
    fillChange('senha-atual-longa', 'senha-nova-longa');
    await waitFor(() => expect(sessions).toHaveBeenCalledTimes(2));
  });

  it('shows a wrong current password and keeps what was typed', async () => {
    vi.spyOn(authService, 'changePassword').mockRejectedValue(new ApiError(400, 'CURRENT_PASSWORD_INVALID'));
    renderWithProviders(<ChangePasswordForm />);
    fillChange('senha-errada-longa', 'senha-nova-longa');
    expect((await screen.findByRole('alert')).textContent).toBe('Your current password is incorrect.');
    expect((screen.getByLabelText('New password') as HTMLInputElement).value).toBe('senha-nova-longa');
  });

  it('does not call the server when the new password is short or differs', async () => {
    const change = vi.spyOn(authService, 'changePassword');
    renderWithProviders(<ChangePasswordForm />);
    fillChange('senha-atual-longa', 'curta');
    expect(await screen.findByText('Use at least 10 characters.')).toBeTruthy();
    fillChange('senha-atual-longa', 'senha-nova-longa', 'senha-diferente-longa');
    expect(await screen.findByText('The passwords are different.')).toBeTruthy();
    expect(change).not.toHaveBeenCalled();
  });
});

describe('sessions list', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.replace.mockReset();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    useToastStore.setState({ items: [] });
  });
  afterEach(() => cleanup());

  it('names the devices and marks this one', async () => {
    vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    renderWithProviders(<SessionsList />);
    expect(await screen.findByText('This device')).toBeTruthy();
    expect(screen.getByText(/Chrome · Windows/)).toBeTruthy();
    expect(screen.getByText('Unknown device')).toBeTruthy();
  });

  it('ends another session, reads the list again and stays signed in', async () => {
    const list = vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    const revoke = vi.spyOn(authService, 'revokeSession').mockResolvedValue({ current: false });
    renderWithProviders(<SessionsList />);
    fireEvent.click(await screen.findByRole('button', { name: 'End session on Unknown device' }));
    await waitFor(() => expect(revoke.mock.calls[0]?.[0]).toBe('s2'));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(useSessionStore.getState().authenticated).toBe(true);
  });

  it('signs out when the session ended is this one', async () => {
    vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    vi.spyOn(authService, 'revokeSession').mockResolvedValue({ current: true });
    renderWithProviders(<SessionsList />);
    fireEvent.click(await screen.findByRole('button', { name: 'End session on Chrome · Windows' }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
    expect(useSessionStore.getState().authenticated).toBe(false);
  });

  it('stays signed in and warns when the end of a session is refused', async () => {
    vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    vi.spyOn(authService, 'revokeSession').mockRejectedValue(new ApiError(404, 'gone'));
    renderWithProviders(<SessionsList />);
    fireEvent.click(await screen.findByRole('button', { name: 'End session on Unknown device' }));
    await waitFor(() => expect(useToastStore.getState().items.map((toast) => toast.messageKey)).toContain('sessionRevokeFailed'));
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('ends all the others and reads the list again', async () => {
    const list = vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    const others = vi.spyOn(authService, 'revokeOtherSessions').mockResolvedValue({ revoked: 1 });
    renderWithProviders(<SessionsList />);
    fireEvent.click(await screen.findByRole('button', { name: 'End all other sessions' }));
    await waitFor(() => expect(others).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useToastStore.getState().items.map((toast) => toast.messageKey)).toContain('sessionsEnded'));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  });

  it('hides the end all button with a single session and shows the load failure', async () => {
    vi.spyOn(authService, 'sessions').mockResolvedValue([SESSIONS[0]]);
    renderWithProviders(<SessionsList />);
    await screen.findByText('This device');
    expect(screen.queryByRole('button', { name: 'End all other sessions' })).toBeNull();
    cleanup();
    vi.spyOn(authService, 'sessions').mockRejectedValue(new ApiError(500, 'boom'));
    renderWithProviders(<SessionsList />);
    expect(await screen.findByText('Could not load your sessions.')).toBeTruthy();
  });
});

describe('describeDevice', () => {
  it('reads browser and system, and admits when it cannot', () => {
    expect(describeDevice(CHROME)).toBe('Chrome · Windows');
    expect(describeDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile Safari/604.1')).toBe('Safari · iOS');
    expect(describeDevice('curl/8.0')).toBeNull();
    expect(describeDevice(null)).toBeNull();
  });
});
