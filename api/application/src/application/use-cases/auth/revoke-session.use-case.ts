import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AUTH_SESSION_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { AuthSessionRepository } from '@domain/repositories/auth-session.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';

@Injectable()
export class RevokeSessionUseCase {
  constructor(
    @Inject(AUTH_SESSION_INJECT_TOKEN) private readonly sessions: AuthSessionRepository,
    private readonly audit: AuditService,
  ) {}

  async one(principal: AuthPrincipal, sessionId: string): Promise<{ current: boolean }> {
    if (!principal.sessionId) throw new ForbiddenException(AUTH_ERROR.SESSION_REQUIRED);
    if (!(await this.sessions.revokeOwn(sessionId, principal.userId, new Date()))) throw new NotFoundException('Session not found');
    await this.audit.record(principal, 'auth.session_revoked', 'session', sessionId);
    return { current: sessionId === principal.sessionId };
  }

  async others(principal: AuthPrincipal): Promise<{ revoked: number }> {
    if (!principal.sessionId) throw new ForbiddenException(AUTH_ERROR.SESSION_REQUIRED);
    const revoked = await this.sessions.revokeAllForUser(principal.userId, principal.sessionId, new Date());
    await this.audit.record(principal, 'auth.sessions_revoked', 'user', principal.userId, { revoked });
    return { revoked };
  }
}
