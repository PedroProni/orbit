import { beforeEach, describe, expect, it, vi } from 'vitest';
import en from '../../messages/en.json';
import pt from '../../messages/pt.json';
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE } from '@/config/app.constants';

const mocks = vi.hoisted(() => ({ cookie: undefined as string | undefined, headers: vi.fn() }));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (name: string) => (name === 'NEXT_LOCALE' && mocks.cookie !== undefined ? { value: mocks.cookie } : undefined) }),
  headers: mocks.headers,
}));
vi.mock('next-intl/server', () => ({ getRequestConfig: (factory: unknown) => factory }));

const resolve = async () => {
  const { default: config } = await import('@/i18n/request');
  return (config as unknown as () => Promise<{ locale: string; messages: unknown }>)();
};

describe('language of a request', () => {
  beforeEach(() => {
    mocks.cookie = undefined;
    mocks.headers.mockReset();
  });

  it('English is the default and both languages stay available', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(LOCALES).toEqual(expect.arrayContaining(['en', 'pt']));
    expect(LOCALE_COOKIE).toBe('NEXT_LOCALE');
  });

  it('serves English with the English catalog to anyone with no saved choice', async () => {
    const config = await resolve();
    expect(config.locale).toBe('en');
    expect(config.messages).toEqual(en);
  });

  it('a saved Portuguese choice still wins', async () => {
    mocks.cookie = 'pt';
    const config = await resolve();
    expect(config.locale).toBe('pt');
    expect(config.messages).toEqual(pt);
  });

  it('a saved English choice stays English', async () => {
    mocks.cookie = 'en';
    expect((await resolve()).locale).toBe('en');
  });

  it.each(['fr', '', 'PT', '../pt'])('an unknown saved value %j falls back to English', async (value) => {
    mocks.cookie = value;
    const config = await resolve();
    expect(config.locale).toBe('en');
    expect(config.messages).toEqual(en);
  });

  it('never reads the browser language', async () => {
    await resolve();
    expect(mocks.headers).not.toHaveBeenCalled();
  });
});
