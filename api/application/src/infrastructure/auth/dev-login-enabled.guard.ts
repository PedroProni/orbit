import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { EnvConfigService } from '@common/env/services/env-config.service';

@Injectable()
export class DevLoginEnabledGuard implements CanActivate {
  constructor(private readonly env: EnvConfigService) {}

  canActivate(): boolean {
    if (!this.env.isDevLoginEnabled()) throw new NotFoundException();
    return true;
  }
}
