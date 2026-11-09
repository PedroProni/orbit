import { GoneException, Inject, Injectable } from '@nestjs/common';
import { AUTH_TOKEN_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { AuthTokenRepository } from '@domain/repositories/auth-token.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { AccessLinkService } from '@application/services/access-link.service';

@Injectable()
export class CheckAccessLinkUseCase {
  constructor(
    @Inject(AUTH_TOKEN_INJECT_TOKEN) private readonly tokens: AuthTokenRepository,
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
  ) {}

  async execute(token: string) {
    const row = await this.tokens.findUsable(AccessLinkService.hash(token), new Date());
    const user = row ? await this.users.findByIdInWorkspace(row.getUserId(), row.getWorkspaceId()) : null;
    if (!row || !user?.isActive()) throw new GoneException(AUTH_ERROR.INVALID_LINK);
    return { kind: row.getKind(), email: user.getEmail(), expiresAt: row.getExpiresAt() };
  }
}
