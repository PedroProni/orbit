import { NotFoundException } from '@nestjs/common';
import { DevLoginEnabledGuard } from './dev-login-enabled.guard';
import { EnvConfigService } from '@common/env/services/env-config.service';

describe('DevLoginEnabledGuard', () => {
  const guardWith = (enabled: boolean) => new DevLoginEnabledGuard({ isDevLoginEnabled: () => enabled } as unknown as EnvConfigService);

  it('answers 404 when dev login is off', () => {
    expect(() => guardWith(false).canActivate()).toThrow(NotFoundException);
  });

  it('lets the request through when dev login is on', () => {
    expect(guardWith(true).canActivate()).toBe(true);
  });
});
