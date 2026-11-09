// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGenerateAccessLink, useInviteUser } from '@/hooks/use-account';
import { authService } from '@/services/auth.service';

const LINK = { token: 'segredo-do-link', kind: 'invite', expiresAt: '2026-11-06T11:00:00.000Z' } as const;

const clientWithWrapper = () => {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, wrapper };
};

describe('access link in memory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forgets a generated link once the dialog is gone', async () => {
    vi.spyOn(authService, 'generateAccessLink').mockResolvedValue(LINK);
    const { client, wrapper } = clientWithWrapper();
    const { result, unmount } = renderHook(() => useGenerateAccessLink(), { wrapper });
    await act(() => result.current.mutateAsync('u1'));
    unmount();
    await waitFor(() => expect(client.getMutationCache().getAll()).toHaveLength(0));
  });

  it('forgets the invite link once the dialog is gone', async () => {
    vi.spyOn(authService, 'inviteUser').mockResolvedValue({ user: { id: 'u1' }, link: LINK } as never);
    const { client, wrapper } = clientWithWrapper();
    const { result, unmount } = renderHook(() => useInviteUser(), { wrapper });
    await act(() => result.current.mutateAsync({ name: 'Ana', email: 'ana@example.com', role: 'member', allowExternalEmail: false }));
    unmount();
    await waitFor(() => expect(client.getMutationCache().getAll()).toHaveLength(0));
  });
});
