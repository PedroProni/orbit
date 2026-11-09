import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AUTH_SESSION_INJECT_TOKEN, AUTH_TOKEN_INJECT_TOKEN, PASSWORD_HASHER_TOKEN, USER_CREDENTIAL_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { AuthTokenRepository } from '@domain/repositories/auth-token.repository';
import { AuthSessionRepository } from '@domain/repositories/auth-session.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserCredentialRepository } from '@domain/repositories/user-credential.repository';
import { PasswordHasher } from '@domain/services/password-hasher.service';
import { PasswordPolicy } from '@domain/policies/password.policy';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditService } from '@application/services/audit.service';
import { LoginThrottleService } from '@application/services/login-throttle.service';
import { ChangePasswordCommand } from '@application/commands/auth/change-password.command';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(AUTH_TOKEN_INJECT_TOKEN) private readonly tokens: AuthTokenRepository,
    @Inject(AUTH_SESSION_INJECT_TOKEN) private readonly sessions: AuthSessionRepository,
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(USER_CREDENTIAL_INJECT_TOKEN) private readonly credentials: UserCredentialRepository,
    @Inject(PASSWORD_HASHER_TOKEN) private readonly hasher: PasswordHasher,
    private readonly throttle: LoginThrottleService,
    private readonly audit: AuditService,
  ) {}

  async execute(principal: AuthPrincipal, command: ChangePasswordCommand): Promise<{ revoked: number }> {
    if (!principal.sessionId) throw new ForbiddenException(AUTH_ERROR.SESSION_REQUIRED);
    if (!(await this.throttle.reservePasswordChange(principal.userId))) throw new HttpException(AUTH_ERROR.TOO_MANY_ATTEMPTS, HttpStatus.TOO_MANY_REQUESTS);
    const user = await this.users.findByIdInWorkspace(principal.userId, principal.workspaceId);
    if (!user) throw new NotFoundException('User not found');
    const credential = await this.credentials.findById(user.getId());
    if (!credential || !(await this.hasher.verify(credential.getPasswordHash(), command.currentPassword))) throw new BadRequestException(AUTH_ERROR.CURRENT_PASSWORD_INVALID);
    const violation = PasswordPolicy.violation(command.newPassword, user.getEmail());
    if (violation) throw new BadRequestException(violation);
    if (command.newPassword === command.currentPassword) throw new BadRequestException(AUTH_ERROR.PASSWORD_UNCHANGED);
    const passwordHash = await this.hasher.hash(command.newPassword);
    const now = new Date();
    const revoked = await this.sessions.revokeAllForUser(user.getId(), principal.sessionId, now);
    await this.credentials.savePassword(user.getId(), user.getWorkspaceId(), passwordHash, now);
    await this.tokens.invalidateUnused(user.getId(), [AuthTokenKind.RESET], now);
    await this.throttle.clearPasswordChange(user.getId());
    await this.audit.record(principal, 'auth.password_changed', 'user', user.getId(), { revoked });
    return { revoked };
  }
}
