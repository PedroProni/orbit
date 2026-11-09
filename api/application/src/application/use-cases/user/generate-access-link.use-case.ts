import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_CREDENTIAL_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserCredentialRepository } from '@domain/repositories/user-credential.repository';
import { AccountAccessPolicy } from '@domain/policies/account-access.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AccessLinkService } from '@application/services/access-link.service';
import { AuditService } from '@application/services/audit.service';

@Injectable()
export class GenerateAccessLinkUseCase {
  constructor(
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(USER_CREDENTIAL_INJECT_TOKEN) private readonly credentials: UserCredentialRepository,
    private readonly links: AccessLinkService,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, userId: string) {
    const target = await this.users.findByIdInWorkspace(userId, principal.workspaceId);
    if (!target) throw new NotFoundException('User not found');
    if (target.getId() === principal.userId) throw new BadRequestException(AUTH_ERROR.OWN_ACCESS_LINK);
    if (!AccountAccessPolicy.canAdminister(principal, target.getRole())) throw new ForbiddenException(AUTH_ERROR.ACCESS_NOT_ALLOWED);
    if (!target.isActive()) throw new ConflictException(AUTH_ERROR.USER_DISABLED);
    const kind = (await this.credentials.findById(target.getId())) ? AuthTokenKind.RESET : AuthTokenKind.INVITE;
    const link = await this.links.issue(target, kind, principal.userId);
    await this.audit.record(principal, 'auth.access_link_generated', 'user', target.getId(), { kind });
    return link;
  }
}
