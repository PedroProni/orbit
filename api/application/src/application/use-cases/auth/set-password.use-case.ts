import { BadRequestException, GoneException, Inject, Injectable } from '@nestjs/common';
import { AUTH_SESSION_INJECT_TOKEN, AUTH_TOKEN_INJECT_TOKEN, PASSWORD_HASHER_TOKEN, USER_CREDENTIAL_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { AuthTokenRepository } from '@domain/repositories/auth-token.repository';
import { AuthSessionRepository } from '@domain/repositories/auth-session.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserCredentialRepository } from '@domain/repositories/user-credential.repository';
import { PasswordHasher } from '@domain/services/password-hasher.service';
import { PasswordPolicy } from '@domain/policies/password.policy';
import { AccessLinkService } from '@application/services/access-link.service';
import { AuditService } from '@application/services/audit.service';
import { AuditActorFactory } from '@application/services/audit-actor.factory';
import { LoginThrottleService } from '@application/services/login-throttle.service';
import { SetPasswordCommand } from '@application/commands/auth/set-password.command';

@Injectable()
export class SetPasswordUseCase {
  constructor(
    @Inject(AUTH_TOKEN_INJECT_TOKEN) private readonly tokens: AuthTokenRepository,
    @Inject(AUTH_SESSION_INJECT_TOKEN) private readonly sessions: AuthSessionRepository,
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(USER_CREDENTIAL_INJECT_TOKEN) private readonly credentials: UserCredentialRepository,
    @Inject(PASSWORD_HASHER_TOKEN) private readonly hasher: PasswordHasher,
    private readonly throttle: LoginThrottleService,
    private readonly audit: AuditService,
  ) {}

  async execute(command: SetPasswordCommand): Promise<void> {
    const tokenHash = AccessLinkService.hash(command.token);
    const row = await this.tokens.findUsable(tokenHash, new Date());
    const user = row ? await this.users.findByIdInWorkspace(row.getUserId(), row.getWorkspaceId()) : null;
    if (!row || !user?.isActive()) throw new GoneException(AUTH_ERROR.INVALID_LINK);
    const violation = PasswordPolicy.violation(command.password, user.getEmail());
    if (violation) throw new BadRequestException(violation);
    const passwordHash = await this.hasher.hash(command.password);
    const now = new Date();
    if (!(await this.tokens.consume(tokenHash, now))) throw new GoneException(AUTH_ERROR.INVALID_LINK);
    await this.sessions.revokeAllForUser(user.getId(), null, now);
    await this.credentials.savePassword(user.getId(), user.getWorkspaceId(), passwordHash, now);
    await this.tokens.invalidateUnused(user.getId(), [AuthTokenKind.INVITE, AuthTokenKind.RESET], now);
    await this.throttle.clearAccount(user.getEmail());
    await this.audit.record(AuditActorFactory.forUser(user), 'auth.password_set', 'user', user.getId(), { via: row.getKind() });
  }
}
