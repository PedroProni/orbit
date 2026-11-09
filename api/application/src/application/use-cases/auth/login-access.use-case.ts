import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { IDENTITY_VERIFIER_TOKEN, SESSION_ISSUER_TOKEN } from '@domain/constants/inject-token.constant';
import { IdentityVerifier } from '@domain/services/identity-verifier.service';
import { SessionIssuer } from '@domain/services/session-issuer.service';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { UserProvisioningService } from '@application/services/user-provisioning.service';
import { LoginAccessCommand } from '@application/commands/auth/login-access.command';
import { UserPresenter } from '@application/presenters/user.presenter';
import { SessionContext } from '@domain/types/session-context.type';

@Injectable()
export class LoginAccessUseCase {
  constructor(
    @Inject(IDENTITY_VERIFIER_TOKEN) private readonly verifier: IdentityVerifier,
    @Inject(SESSION_ISSUER_TOKEN) private readonly sessions: SessionIssuer,
    private readonly env: EnvConfigService,
    private readonly provisioning: UserProvisioningService,
  ) {}

  async execute(command: LoginAccessCommand, context?: SessionContext) {
    if (!command.assertion) throw new UnauthorizedException('Missing access assertion');
    const identity = await this.verifier.verify(command.assertion).catch(() => {
      throw new UnauthorizedException('Invalid access assertion');
    });
    const domain = this.env.getAllowedEmailDomain();
    if (!identity.emailVerified) throw new ForbiddenException('Email not verified');
    if (!domain || identity.email.toLowerCase().split('@')[1] !== domain) throw new ForbiddenException('Email domain not allowed');
    const user = await this.provisioning.provision(identity);
    if (!user.isActive()) throw new ForbiddenException('User disabled');
    const accessToken = await this.sessions.issue(user.getId(), user.getWorkspaceId(), context);
    return { accessToken, user: UserPresenter.toView(user) };
  }
}
