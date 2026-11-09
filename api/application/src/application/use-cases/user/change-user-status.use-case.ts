import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AUTH_SESSION_INJECT_TOKEN, AUTH_TOKEN_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { UserRepository } from '@domain/repositories/user.repository';
import { AuthSessionRepository } from '@domain/repositories/auth-session.repository';
import { AuthTokenRepository } from '@domain/repositories/auth-token.repository';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { UserStatus } from '@domain/enums/user.enums';
import { RolePolicy } from '@domain/policies/role.policy';
import { AuditService } from '@application/services/audit.service';
import { UserPresenter } from '@application/presenters/user.presenter';

@Injectable()
export class ChangeUserStatusUseCase {
  constructor(
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(AUTH_SESSION_INJECT_TOKEN) private readonly sessions: AuthSessionRepository,
    @Inject(AUTH_TOKEN_INJECT_TOKEN) private readonly tokens: AuthTokenRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, userId: string, status: UserStatus) {
    const target = await this.users.findByIdInWorkspace(userId, principal.workspaceId);
    if (!target) throw new NotFoundException('User not found');
    if (target.getId() === principal.userId) throw new BadRequestException('Cannot change own status');
    if (!RolePolicy.canManageUser(principal.role, target.getRole())) throw new ForbiddenException('Not allowed to manage this user');
    if (status === UserStatus.DISABLED) target.disable();
    else target.enable();
    const saved = await this.users.update(target);
    if (status === UserStatus.DISABLED) {
      const now = new Date();
      await this.sessions.revokeAllForUser(userId, null, now);
      await this.tokens.invalidateUnused(userId, [AuthTokenKind.INVITE, AuthTokenKind.RESET], now);
    }
    await this.audit.record(principal, 'user.status_changed', 'user', userId, { status });
    return UserPresenter.toView(saved);
  }
}
