// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Providers } from '@/components/common/providers';
import { useCapabilities, useMe } from '@/hooks/use-capabilities';
import { LEGACY_SESSION_STORAGE_KEY } from '@/config/app.constants';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { Principal } from '@/types/api.types';

const PRINCIPAL = { id: 'u1', workspaceId: 'w1', email: 'ana@x.io', name: 'Ana', role: 'member', scopes: [] } as unknown as Principal;

describe('Providers session start', () => {
  beforeEach(() => {
    useSessionStore.setState({ authenticated: false, hydrated: false });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the session when the server accepts the cookie', async () => {
    const me = vi.spyOn(orbitService, 'me').mockResolvedValue(PRINCIPAL);
    render(
      <Providers>
        <span>conteúdo</span>
      </Providers>,
    );
    await waitFor(() => expect(useSessionStore.getState().hydrated).toBe(true));
    expect(useSessionStore.getState().authenticated).toBe(true);
    expect(me).toHaveBeenCalledTimes(1);
    expect(screen.getByText('conteúdo')).toBeTruthy();
  });

  it('reuses the identity it just read instead of asking the server again', async () => {
    const me = vi.spyOn(orbitService, 'me').mockResolvedValue(PRINCIPAL);
    const Reader = () => {
      const identity = useMe();
      const capabilities = useCapabilities();
      return <span>{identity.data?.name ?? 'sem nome'}:{String(capabilities.member)}</span>;
    };
    render(
      <Providers>
        <Reader />
      </Providers>,
    );
    expect(await screen.findByText('Ana:true')).toBeTruthy();
    expect(me).toHaveBeenCalledTimes(1);
  });

  it('stays signed out when the server refuses, even with an old token kept in the browser', async () => {
    window.localStorage.setItem(LEGACY_SESSION_STORAGE_KEY, 'token-antigo-no-navegador');
    const me = vi.spyOn(orbitService, 'me').mockRejectedValue(new Error('401'));
    render(
      <Providers>
        <span>conteúdo</span>
      </Providers>,
    );
    await waitFor(() => expect(useSessionStore.getState().hydrated).toBe(true));
    expect(useSessionStore.getState().authenticated).toBe(false);
    expect(me).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(LEGACY_SESSION_STORAGE_KEY)).toBeNull();
  });
});
