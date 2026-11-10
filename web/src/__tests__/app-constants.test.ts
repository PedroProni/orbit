import { afterEach, describe, expect, it, vi } from 'vitest';

const loadWith = async (value: string | undefined) => {
  vi.stubEnv('NEXT_PUBLIC_DEV_LOGIN', value);
  vi.stubEnv('NEXT_PUBLIC_ACCESS_LOGIN', value);
  vi.resetModules();
  return import('@/config/app.constants');
};

describe('login flags', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([undefined, '', 'false', '1', 'TRUE'])('keeps the password login as the default with %s', async (value) => {
    const flags = await loadWith(value);
    expect(flags.DEV_LOGIN_ENABLED).toBe(false);
    expect(flags.ACCESS_LOGIN_ENABLED).toBe(false);
  });

  it('turns the other logins on only when asked', async () => {
    const flags = await loadWith('true');
    expect(flags.DEV_LOGIN_ENABLED).toBe(true);
    expect(flags.ACCESS_LOGIN_ENABLED).toBe(true);
  });

  it('keeps the screens that work without a session public', async () => {
    const { PUBLIC_PATHS } = await loadWith(undefined);
    expect([...PUBLIC_PATHS].sort()).toEqual(['/f/', '/forgot-password', '/login', '/set-password']);
  });
});

describe('old session key', () => {
  it('is the name the old build used in the browser, so it gets removed', async () => {
    const { LEGACY_SESSION_STORAGE_KEY } = await import('@/config/app.constants');
    expect(LEGACY_SESSION_STORAGE_KEY).toBe('orbit.session');
  });
});
