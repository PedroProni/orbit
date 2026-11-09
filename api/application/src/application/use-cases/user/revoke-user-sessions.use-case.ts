import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AUTH_SESSION_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { AuthSessionRepository } from '@domain/repositories/auth-session.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { AccountAccessPolicy } from '@domain/policies/account-access.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';

@Injectable()
export class RevokeUserSessionsUseCase {
  constructor(
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(AUTH_SESSION_INJECT_TOKEN) private readonly sessions: AuthSessionRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, userId: string): Promise<{ revoked: number }> {
    const target = await this.users.findByIdInWorkspace(userId, principal.workspaceId);
    if (!target) throw new NotFoundException('User not found');
    if (!AccountAccessPolicy.canAdminister(principal, target.getRole())) throw new ForbiddenException(AUTH_ERROR.ACCESS_NOT_ALLOWED);
    const revoked = await this.sessions.revokeAllForUser(target.getId(), target.getId() === principal.userId ? (principal.sessionId ?? null) : null, new Date());
    await this.audit.record(principal, 'auth.sessions_revoked', 'user', target.getId(), { revoked });
    return { revoked };
  }
}
