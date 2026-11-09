import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AUTH_SESSION_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { AuthSessionRepository } from '@domain/repositories/auth-session.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(AUTH_SESSION_INJECT_TOKEN) private readonly sessions: AuthSessionRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal): Promise<void> {
    if (!principal.sessionId) throw new ForbiddenException(AUTH_ERROR.SESSION_REQUIRED);
    await this.sessions.revokeOwn(principal.sessionId, principal.userId, new Date());
    await this.audit.record(principal, 'auth.logout', 'session', principal.sessionId);
  }
}
