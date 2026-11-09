import { HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PASSWORD_HASHER_TOKEN, SESSION_ISSUER_TOKEN, USER_CREDENTIAL_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserCredentialRepository } from '@domain/repositories/user-credential.repository';
import { PasswordHasher } from '@domain/services/password-hasher.service';
import { SessionIssuer } from '@domain/services/session-issuer.service';
import { UserEntity } from '@domain/entities/user.entity';
import { SessionContext } from '@domain/types/session-context.type';
import { AuditService } from '@application/services/audit.service';
import { AuditActorFactory } from '@application/services/audit-actor.factory';
import { LoginThrottleService } from '@application/services/login-throttle.service';
import { UserPresenter } from '@application/presenters/user.presenter';
import { PasswordLoginCommand } from '@application/commands/auth/password-login.command';

@Injectable()
export class PasswordLoginUseCase {
  constructor(
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(USER_CREDENTIAL_INJECT_TOKEN) private readonly credentials: UserCredentialRepository,
    @Inject(PASSWORD_HASHER_TOKEN) private readonly hasher: PasswordHasher,
    @Inject(SESSION_ISSUER_TOKEN) private readonly sessions: SessionIssuer,
    private readonly throttle: LoginThrottleService,
    private readonly audit: AuditService,
  ) {}

  async execute(command: PasswordLoginCommand) {
    const email = command.email.trim().toLowerCase();
    if (!(await this.throttle.reserveLogin(email, command.context.ip))) throw new HttpException(AUTH_ERROR.TOO_MANY_ATTEMPTS, HttpStatus.TOO_MANY_REQUESTS);
    const user = await this.users.findOne({ email });
    const credential = user?.isActive() ? await this.credentials.findById(user.getId()) : null;
    if (!user || !credential) {
      await this.hasher.burn(command.password);
      return this.refuse(user, command.context);
    }
    if (!(await this.hasher.verify(credential.getPasswordHash(), command.password))) return this.refuse(user, command.context);
    await this.throttle.settleLogin(email, command.context.ip);
    const token = await this.sessions.issue(user.getId(), user.getWorkspaceId(), command.context);
    await this.audit.record(AuditActorFactory.forUser(user), 'auth.login_succeeded', 'user', user.getId(), { ip: command.context.ip });
    return { token, user: UserPresenter.toView(user) };
  }

  private async refuse(user: UserEntity | null, context: SessionContext): Promise<never> {
    if (user) await this.audit.record(AuditActorFactory.system(user.getWorkspaceId(), 'login'), 'auth.login_failed', 'user', user.getId(), { ip: context.ip });
    throw new UnauthorizedException(AUTH_ERROR.INVALID_CREDENTIALS);
  }
}
