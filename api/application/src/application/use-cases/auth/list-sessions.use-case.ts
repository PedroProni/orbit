import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AUTH_SESSION_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { AuthSessionRepository } from '@domain/repositories/auth-session.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuthSessionPresenter } from '@application/presenters/auth-session.presenter';

@Injectable()
export class ListSessionsUseCase {
  constructor(@Inject(AUTH_SESSION_INJECT_TOKEN) private readonly sessions: AuthSessionRepository) {}

  async execute(principal: AuthPrincipal) {
    if (!principal.sessionId) throw new ForbiddenException(AUTH_ERROR.SESSION_REQUIRED);
    const rows = await this.sessions.findUsableByUser(principal.userId, new Date());
    return rows.map(row => AuthSessionPresenter.toView(row, principal.sessionId));
  }
}
