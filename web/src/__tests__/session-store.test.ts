import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEGACY_SESSION_STORAGE_KEY } from '@/config/app.constants';
import { useSessionStore } from '@/stores/session.store';

describe('session store', () => {
  const removeItem = vi.fn();

  beforeEach(() => {
    removeItem.mockClear();
    vi.stubGlobal('window', { localStorage: { getItem: () => 'token-antigo-no-navegador', setItem: vi.fn(), removeItem } });
    useSessionStore.setState({ authenticated: false, hydrated: false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('removes the token an older build left in the browser', async () => {
    await useSessionStore.getState().hydrate(async () => undefined);
    expect(removeItem).toHaveBeenCalledWith(LEGACY_SESSION_STORAGE_KEY);
  });

  it('trusts the server answer and not what the browser kept', async () => {
    await useSessionStore.getState().hydrate(async () => {
      throw new Error('401');
    });
    expect(useSessionStore.getState()).toMatchObject({ authenticated: false, hydrated: true });
  });

  it('opens the session when the server accepts the cookie', async () => {
    await useSessionStore.getState().hydrate(async () => undefined);
    expect(useSessionStore.getState()).toMatchObject({ authenticated: true, hydrated: true });
  });

  it('clears the session on sign-out', async () => {
    await useSessionStore.getState().hydrate(async () => undefined);
    useSessionStore.getState().clear();
    expect(useSessionStore.getState().authenticated).toBe(false);
  });
});
