// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { renderWithProviders } from '../helpers/render-with-providers';
import en from '../../../messages/en.json';
import AccountPage from '@/app/(app)/account/page';
import { ChangePasswordForm } from '@/components/account/change-password-form';
import { describeDevice } from '@/components/account/device.helpers';
import { SessionsList } from '@/components/account/sessions-list';
import { ApiError } from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import { useSessionStore } from '@/stores/session.store';
import { useToastStore } from '@/stores/toast.store';

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('next-intl/server', () => ({ getTranslations: async (namespace: 'account') => (key: 'title') => en[namespace][key] }));

const SESSIONS = [
  { id: 's1', ip: '10.0.0.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0', createdAt: '2026-11-06T10:00:00.000Z', expiresAt: '2026-11-13T10:00:00.000Z', current: true },
  { id: 's2', ip: null, userAgent: null, createdAt: '2026-11-05T10:00:00.000Z', expiresAt: '2026-11-12T10:00:00.000Z', current: false },
];

const never = <T,>() => new Promise<T>(() => undefined);
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
const toasts = () => useToastStore.getState().items.map((toast) => `${toast.kind}:${toast.messageKey}`);

const fillChange = (current = 'senha-atual-longa', next = 'senha-nova-longa') => {
  fireEvent.change(screen.getByLabelText('Current password'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('Repeat the password'), { target: { value: next } });
  fireEvent.click(button('Change password'));
};

describe('account page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useToastStore.setState({ items: [] });
  });
  afterEach(() => cleanup());

  it('shows the title, the password form and the sessions', async () => {
    vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    renderWithProviders(await AccountPage());
    expect(screen.getByRole('heading', { level: 1, name: 'My account' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Password' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Where you are signed in' })).toBeTruthy();
    expect(await screen.findByText('This device')).toBeTruthy();
  });
});

describe('change password details', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useToastStore.setState({ items: [] });
  });
  afterEach(() => cleanup());

  it('keeps the account field out of sight and starts with no error', () => {
    const { container } = renderWithProviders(<ChangePasswordForm />);
    const account = container.querySelector('input[autocomplete="username"]') as HTMLInputElement;
    expect(account.hidden).toBe(true);
    expect(account.readOnly).toBe(true);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('reports the change as a success', async () => {
    vi.spyOn(authService, 'changePassword').mockResolvedValue({ revoked: 2 });
    renderWithProviders(<ChangePasswordForm />);
    fillChange();
    await waitFor(() => expect(toasts()).toContain('success:passwordChanged'));
  });

  it('asks for the current password on the screen', async () => {
    const change = vi.spyOn(authService, 'changePassword').mockResolvedValue({ revoked: 0 });
    renderWithProviders(<ChangePasswordForm />);
    fillChange('', 'senha-nova-longa');
    expect(await screen.findByText('Enter your password')).toBeTruthy();
    expect(change).not.toHaveBeenCalled();
  });

  it('blocks a second click and removes the old error on the next try', async () => {
    const change = vi.spyOn(authService, 'changePassword').mockRejectedValueOnce(new ApiError(400, 'CURRENT_PASSWORD_INVALID'));
    renderWithProviders(<ChangePasswordForm />);
    fillChange();
    expect(await screen.findByRole('alert')).toBeTruthy();
    change.mockReturnValue(never());
    fillChange();
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    await waitFor(() => expect(button('Change password').disabled).toBe(true));
  });
});

describe('device names', () => {
  it.each([
    ['Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0', 'Edge · Windows'],
    ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 OPR/105.0', 'Opera · Linux'],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0', 'Firefox · Linux'],
    ['Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36', 'Chrome · Android'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15', 'Safari · macOS'],
  ])('names %s', (agent, name) => {
    expect(describeDevice(agent)).toBe(name);
  });

  it('names only what it recognises', () => {
    expect(describeDevice('Mozilla/5.0 (X11; Linux x86_64)')).toBe('Linux');
    expect(describeDevice('Chrome/120.0')).toBe('Chrome');
  });

  it('admits when it recognises nothing', () => {
    expect(describeDevice('curl/8.0')).toBeNull();
    expect(describeDevice('')).toBeNull();
    expect(describeDevice(null)).toBeNull();
  });
});

describe('sessions list details', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.replace.mockReset();
    useSessionStore.setState({ authenticated: true, hydrated: true });
    useToastStore.setState({ items: [] });
  });
  afterEach(() => cleanup());

  it('forgets the cache when the session ended is this one', async () => {
    vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    vi.spyOn(authService, 'revokeSession').mockResolvedValue({ current: true });
    const clearCache = vi.spyOn(QueryClient.prototype, 'clear');
    renderWithProviders(<SessionsList />);
    fireEvent.click(await screen.findByRole('button', { name: 'End session on Chrome · Windows' }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
    expect(clearCache).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().authenticated).toBe(false);
  });

  it('keeps the cache when the session ended is another one', async () => {
    vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    const revoke = vi.spyOn(authService, 'revokeSession').mockResolvedValue({ current: false });
    const clearCache = vi.spyOn(QueryClient.prototype, 'clear');
    renderWithProviders(<SessionsList />);
    fireEvent.click(await screen.findByRole('button', { name: 'End session on Unknown device' }));
    await waitFor(() => expect(revoke).toHaveBeenCalled());
    await waitFor(() => expect(authService.sessions).toHaveBeenCalledTimes(2));
    expect(clearCache).not.toHaveBeenCalled();
  });

  it('says what each button does and shows what it knows of each session', async () => {
    vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    renderWithProviders(<SessionsList />);
    const current = await screen.findByRole('button', { name: 'End session on Chrome · Windows' });
    expect(current.textContent).toBe('Sign out here');
    expect(button('End session on Unknown device').textContent).toBe('End session');
    expect(screen.getByText(/^10\.0\.0\.1, signed in on/)).toBeTruthy();
    expect(screen.getByText(/^unknown address, signed in on/)).toBeTruthy();
  });

  it('blocks the buttons while a session is ending', async () => {
    vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    vi.spyOn(authService, 'revokeSession').mockReturnValue(never());
    renderWithProviders(<SessionsList />);
    fireEvent.click(await screen.findByRole('button', { name: 'End session on Unknown device' }));
    await waitFor(() => expect(button('End session on Unknown device').disabled).toBe(true));
    expect(button('End session on Chrome · Windows').disabled).toBe(true);
  });

  it('blocks the end all button while it runs and warns when refused', async () => {
    vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    vi.spyOn(authService, 'revokeOtherSessions').mockReturnValueOnce(never());
    renderWithProviders(<SessionsList />);
    fireEvent.click(await screen.findByRole('button', { name: 'End all other sessions' }));
    await waitFor(() => expect(button('End all other sessions').disabled).toBe(true));
    cleanup();
    vi.spyOn(authService, 'revokeOtherSessions').mockRejectedValue(new ApiError(500, 'boom'));
    renderWithProviders(<SessionsList />);
    fireEvent.click(await screen.findByRole('button', { name: 'End all other sessions' }));
    await waitFor(() => expect(toasts()).toContain('error:sessionRevokeFailed'));
  });

  it('reports each ending with the right kind of message', async () => {
    vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    vi.spyOn(authService, 'revokeOtherSessions').mockResolvedValue({ revoked: 1 });
    vi.spyOn(authService, 'revokeSession').mockRejectedValue(new ApiError(404, 'gone'));
    renderWithProviders(<SessionsList />);
    fireEvent.click(await screen.findByRole('button', { name: 'End all other sessions' }));
    await waitFor(() => expect(toasts()).toContain('success:sessionsEnded'));
    fireEvent.click(button('End session on Unknown device'));
    await waitFor(() => expect(toasts()).toContain('error:sessionRevokeFailed'));
  });

  it('shows a placeholder while loading and only that', () => {
    vi.spyOn(authService, 'sessions').mockReturnValue(never());
    const { container } = renderWithProviders(<SessionsList />);
    expect(container.querySelector('.skeleton')).not.toBeNull();
    expect(screen.queryByText('Could not load your sessions.')).toBeNull();
  });

  it('removes the placeholder and shows no error once loaded', async () => {
    vi.spyOn(authService, 'sessions').mockResolvedValue(SESSIONS);
    const { container } = renderWithProviders(<SessionsList />);
    await screen.findByText('This device');
    expect(container.querySelector('.skeleton')).toBeNull();
    expect(screen.queryByText('Could not load your sessions.')).toBeNull();
  });

  it('shows the load failure', async () => {
    vi.spyOn(authService, 'sessions').mockRejectedValue(new ApiError(500, 'boom'));
    renderWithProviders(<SessionsList />);
    expect(await screen.findByText('Could not load your sessions.')).toBeTruthy();
  });
});
