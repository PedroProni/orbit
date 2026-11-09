// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { renderWithProviders } from '../helpers/render-with-providers';
import { resetUiStore } from '../helpers/fixtures';
import { AppShell } from '@/components/shell/app-shell';
import { ApiError } from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { useToastStore } from '@/stores/toast.store';
import { Principal } from '@/types/api.types';

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({ usePathname: () => '/inbox', useParams: () => ({}), useRouter: () => ({ replace: mocks.replace, push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/components/shell/sidebar', () => ({ Sidebar: () => null }));
vi.mock('@/components/shell/search-box', () => ({ SearchBox: () => <span>caixa de busca</span> }));
vi.mock('@/components/shell/notifications-bell', () => ({ NotificationsBell: () => null }));

const PRINCIPAL = { id: 'u1', email: 'ana@example.com', name: 'Ana', avatarUrl: null, role: 'member', status: 'active', workspaceId: 'w1', scopes: [] } as unknown as Principal;

const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });

const openShell = (principal = PRINCIPAL) => {
  vi.spyOn(orbitService, 'me').mockResolvedValue(principal);
  renderWithProviders(
    <AppShell>
      <p>conteúdo privado</p>
    </AppShell>,
  );
};

describe('AppShell session', () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    resetUiStore();
    useToastStore.setState({ items: [] });
    useSessionStore.setState({ authenticated: true, hydrated: true });
    vi.stubGlobal('EventSource', class { addEventListener() {} close() {} });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sends a person with no session to the login page and shows nothing private', async () => {
    useSessionStore.setState({ authenticated: false, hydrated: true });
    openShell();
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
    await settle();
    expect(screen.queryByText('conteúdo privado')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
  });

  it('waits for the session check before deciding', async () => {
    useSessionStore.setState({ authenticated: true, hydrated: false });
    openShell();
    await settle();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.queryByText('conteúdo privado')).toBeNull();
    useSessionStore.setState({ authenticated: false, hydrated: false });
    await settle();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
  });

  it('keeps the screen when the identity cannot be read, so the refusal comes from the server', async () => {
    vi.spyOn(orbitService, 'me').mockRejectedValue(new ApiError(500, 'boom'));
    renderWithProviders(
      <AppShell>
        <p>conteúdo privado</p>
      </AppShell>,
    );
    expect(await screen.findByText('conteúdo privado')).toBeTruthy();
  });

  it('gives search to a member and not to a guest', async () => {
    openShell();
    expect(await screen.findByText('caixa de busca')).toBeTruthy();
    cleanup();
    openShell({ ...PRINCIPAL, role: 'guest' } as Principal);
    await settle();
    expect(screen.queryByText('caixa de busca')).toBeNull();
  });

  it('shows the screen to a person with a session', async () => {
    openShell();
    expect(await screen.findByText('conteúdo privado')).toBeTruthy();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('signs out on the server, forgets the cache and goes to the login page', async () => {
    const logout = vi.spyOn(authService, 'logout').mockResolvedValue(undefined);
    const clearCache = vi.spyOn(QueryClient.prototype, 'clear');
    openShell();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(clearCache).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().authenticated).toBe(false);
  });

  it('also leaves when the server says the session had already ended', async () => {
    vi.spyOn(authService, 'logout').mockRejectedValue(new ApiError(401, 'Unauthorized'));
    openShell();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
    expect(useSessionStore.getState().authenticated).toBe(false);
  });

  it('stays and warns when the server could not end the session', async () => {
    vi.spyOn(authService, 'logout').mockRejectedValue(new ApiError(500, 'boom'));
    openShell();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(useToastStore.getState().items.map((toast) => toast.messageKey)).toContain('signOutFailed'));
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(useSessionStore.getState().authenticated).toBe(true);
  });
});
