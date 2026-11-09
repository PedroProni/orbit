import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SESSION_ISSUER_TOKEN } from '@domain/constants/inject-token.constant';
import { SessionIssuer } from '@domain/services/session-issuer.service';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { UserProvisioningService } from '@application/services/user-provisioning.service';
import { DevLoginCommand } from '@application/commands/auth/dev-login.command';
import { UserPresenter } from '@application/presenters/user.presenter';
import { SessionContext } from '@domain/types/session-context.type';

@Injectable()
export class DevLoginUseCase {
  constructor(
    @Inject(SESSION_ISSUER_TOKEN) private readonly sessions: SessionIssuer,
    private readonly env: EnvConfigService,
    private readonly provisioning: UserProvisioningService,
  ) {}

  async execute(command: DevLoginCommand, context?: SessionContext) {
    if (!this.env.isDevLoginEnabled()) throw new NotFoundException();
    const user = await this.provisioning.provision(
      { email: command.email, name: command.name, avatarUrl: null, emailVerified: true },
      { role: command.role, workspaceSlug: command.workspaceSlug, clickupId: command.clickupId },
    );
    if (!user.isActive()) throw new ForbiddenException('User disabled');
    const accessToken = await this.sessions.issue(user.getId(), user.getWorkspaceId(), context);
    return { accessToken, user: UserPresenter.toView(user) };
  }
}
