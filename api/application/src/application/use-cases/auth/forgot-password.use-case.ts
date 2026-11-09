import { Inject, Injectable, Logger } from '@nestjs/common';
import { MAIL_SENDER_TOKEN, USER_CREDENTIAL_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserCredentialRepository } from '@domain/repositories/user-credential.repository';
import { MailSender } from '@domain/services/mail-sender.service';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { ForgotPasswordResult } from '@domain/types/forgot-password-result.type';
import { AccessLinkService } from '@application/services/access-link.service';
import { AuditService } from '@application/services/audit.service';
import { AuditActorFactory } from '@application/services/audit-actor.factory';
import { LoginThrottleService } from '@application/services/login-throttle.service';

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(USER_CREDENTIAL_INJECT_TOKEN) private readonly credentials: UserCredentialRepository,
    @Inject(MAIL_SENDER_TOKEN) private readonly mail: MailSender,
    private readonly links: AccessLinkService,
    private readonly throttle: LoginThrottleService,
    private readonly audit: AuditService,
  ) {}

  execute(rawEmail: string): ForgotPasswordResult {
    if (!this.mail.isConfigured()) return { delivery: 'admin' };
    void this.deliver(rawEmail.trim().toLowerCase()).catch(() => this.logger.warn('Password reset mail could not be sent'));
    return { delivery: 'email' };
  }

  private async deliver(email: string): Promise<void> {
    if (!(await this.throttle.reserveForgot(email))) return;
    const user = await this.users.findOne({ email });
    if (!user?.isActive() || !(await this.credentials.findById(user.getId()))) return;
    const link = await this.links.issue(user, AuthTokenKind.RESET, null);
    await this.mail.sendPasswordReset(user.getEmail(), link.token);
    await this.audit.record(AuditActorFactory.system(user.getWorkspaceId(), 'forgot-password'), 'auth.reset_requested', 'user', user.getId());
  }
}
