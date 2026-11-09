import { LoginThrottleService } from './login-throttle.service';
import { FORGOT_ACCOUNT_LIMIT, LOGIN_ACCOUNT_LIMIT, LOGIN_IP_LIMIT, PASSWORD_CHANGE_LIMIT } from '@domain/constants/auth.constant';

const memoryAttempts = () => {
  const counts = new Map<string, number>();
  return {
    counts,
    hit: jest.fn(async (key: string) => {
      counts.set(key, (counts.get(key) ?? 0) + 1);
      return counts.get(key)!;
    }),
    clear: jest.fn(async (key: string) => {
      counts.delete(key);
    }),
    release: jest.fn(async (key: string) => {
      counts.set(key, Math.max(0, (counts.get(key) ?? 0) - 1));
    }),
  };
};

const reserve = async (service: LoginThrottleService, times: number, email: (index: number) => string, ip: (index: number) => string | null) => {
  const results: boolean[] = [];
  for (let index = 0; index < times; index += 1) results.push(await service.reserveLogin(email(index), ip(index)));
  return results;
};

describe('LoginThrottleService', () => {
  it('blocks one account from any address after the account limit', async () => {
    const service = new LoginThrottleService(memoryAttempts() as never);
    const results = await reserve(
      service,
      LOGIN_ACCOUNT_LIMIT + 1,
      () => 'a@b.test',
      index => `10.0.0.${index}`,
    );
    expect(results.slice(0, LOGIN_ACCOUNT_LIMIT).every(Boolean)).toBe(true);
    expect(results[LOGIN_ACCOUNT_LIMIT]).toBe(false);
  });

  it('blocks one address across many accounts after the address limit', async () => {
    const service = new LoginThrottleService(memoryAttempts() as never);
    const results = await reserve(
      service,
      LOGIN_IP_LIMIT + 1,
      index => `user${index}@b.test`,
      () => '10.0.0.1',
    );
    expect(results.slice(0, LOGIN_IP_LIMIT).every(Boolean)).toBe(true);
    expect(results[LOGIN_IP_LIMIT]).toBe(false);
  });

  it('counts requests with no address under one shared bucket', async () => {
    const service = new LoginThrottleService(memoryAttempts() as never);
    const results = await reserve(
      service,
      LOGIN_IP_LIMIT + 1,
      index => `user${index}@b.test`,
      () => null,
    );
    expect(results[LOGIN_IP_LIMIT]).toBe(false);
  });

  it('a successful login clears the account and gives back one address attempt only', async () => {
    const attempts = memoryAttempts();
    const service = new LoginThrottleService(attempts as never);
    await reserve(
      service,
      3,
      () => 'a@b.test',
      () => '10.0.0.1',
    );
    await service.settleLogin('a@b.test', '10.0.0.1');
    expect(attempts.clear).toHaveBeenCalledTimes(1);
    expect(attempts.release).toHaveBeenCalledTimes(1);
    expect([...attempts.counts.values()]).toEqual([2]);
  });

  it('never keeps an email or an address in clear in the key', async () => {
    const attempts = memoryAttempts();
    await new LoginThrottleService(attempts as never).reserveLogin('a@b.test', '10.0.0.1');
    const keys = [...attempts.counts.keys()].join(' ');
    expect(keys).not.toContain('a@b.test');
    expect(keys).not.toContain('10.0.0.1');
  });

  it('limits forgot password and password change by their own counters', async () => {
    const attempts = memoryAttempts();
    const service = new LoginThrottleService(attempts as never);
    for (let index = 0; index < FORGOT_ACCOUNT_LIMIT; index += 1) expect(await service.reserveForgot('a@b.test')).toBe(true);
    expect(await service.reserveForgot('a@b.test')).toBe(false);
    for (let index = 0; index < PASSWORD_CHANGE_LIMIT; index += 1) expect(await service.reservePasswordChange('u1')).toBe(true);
    expect(await service.reservePasswordChange('u1')).toBe(false);
    await service.clearPasswordChange('u1');
    expect(await service.reservePasswordChange('u1')).toBe(true);
  });

  it('a reset link can clear the lock of an account', async () => {
    const service = new LoginThrottleService(memoryAttempts() as never);
    await reserve(
      service,
      LOGIN_ACCOUNT_LIMIT + 1,
      () => 'a@b.test',
      index => `10.0.0.${index}`,
    );
    await service.clearAccount('a@b.test');
    expect(await service.reserveLogin('a@b.test', '10.0.1.1')).toBe(true);
  });
});
