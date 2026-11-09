import { ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { DUPLICATE_KEY_CODE } from '@domain/constants/mongo-error.constant';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { UserStatus } from '@domain/enums/user.enums';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserEntity } from '@domain/entities/user.entity';
import { AccountAccessPolicy } from '@domain/policies/account-access.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { newId } from '@common/helpers/functions/id.helper';
import { AccessLinkService } from '@application/services/access-link.service';
import { AuditService } from '@application/services/audit.service';
import { UserPresenter } from '@application/presenters/user.presenter';
import { InviteUserCommand } from '@application/commands/user/invite-user.command';

@Injectable()
export class InviteUserUseCase {
  constructor(
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    private readonly links: AccessLinkService,
    private readonly audit: AuditService,
    private readonly env: EnvConfigService,
  ) {}

  async execute(principal: AuthPrincipal, command: InviteUserCommand) {
    if (!AccountAccessPolicy.canInvite(principal, command.role)) throw new ForbiddenException(AUTH_ERROR.ACCESS_NOT_ALLOWED);
    const email = command.email.trim().toLowerCase();
    const external = email.split('@')[1] !== this.env.getAllowedEmailDomain();
    if (external && !command.allowExternalEmail) throw new ForbiddenException(AUTH_ERROR.EMAIL_DOMAIN_NOT_ALLOWED);
    if (await this.users.findOne({ email })) throw new ConflictException(AUTH_ERROR.USER_EXISTS);
    const now = new Date();
    const user = await this.users
      .create(
        new UserEntity({
          _id: newId(),
          workspaceId: principal.workspaceId,
          email,
          name: command.name.trim(),
          avatarUrl: null,
          clickupId: null,
          role: command.role,
          status: UserStatus.ACTIVE,
          createdAt: now,
          updatedAt: now,
        }),
      )
      .catch((error: { code?: number }) => {
        if (error.code === DUPLICATE_KEY_CODE) throw new ConflictException(AUTH_ERROR.USER_EXISTS);
        throw error;
      });
    const link = await this.links.issue(user, AuthTokenKind.INVITE, principal.userId);
    await this.audit.record(principal, 'user.invited', 'user', user.getId(), { role: command.role, external });
    return { user: UserPresenter.toView(user), link };
  }
}
