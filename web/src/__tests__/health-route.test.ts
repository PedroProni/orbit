import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/health/route';

describe('health route', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('answers ok with the build version', async () => {
    vi.stubEnv('ORBIT_BUILD_SHA', 'abc1234');
    const response = GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', version: 'abc1234' });
  });

  it('falls back to dev without a build version', async () => {
    vi.stubEnv('ORBIT_BUILD_SHA', '');
    expect(await GET().json()).toEqual({ status: 'ok', version: 'dev' });
  });
});
