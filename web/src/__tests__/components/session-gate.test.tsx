// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMe } from '@/hooks/use-capabilities';
import { orbitService } from '@/services/orbit.service';
import { useSessionStore } from '@/stores/session.store';
import { Principal } from '@/types/api.types';

const PRINCIPAL = { id: 'u1', workspaceId: 'w1', email: 'ana@x.io', name: 'Ana', role: 'owner', scopes: ['tasks:read'] } as Principal;

const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;

describe('useMe', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionStore.setState({ authenticated: false });
  });

  it('does not ask who the user is before there is a session', async () => {
    const me = vi.spyOn(orbitService, 'me').mockResolvedValue(PRINCIPAL);
    const { result } = renderHook(() => useMe(), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(me).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it('asks as soon as the session exists', async () => {
    const me = vi.spyOn(orbitService, 'me').mockResolvedValue(PRINCIPAL);
    const { result } = renderHook(() => useMe(), { wrapper });
    act(() => useSessionStore.setState({ authenticated: true }));
    await waitFor(() => expect(result.current.data).toEqual(PRINCIPAL));
    expect(me).toHaveBeenCalledTimes(1);
  });
});
