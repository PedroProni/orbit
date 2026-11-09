import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EnvConfigModule } from '@common/env/env-config.module';
import { EnvConfigService } from '@common/env/services/env-config.service';
import { DomainModule } from '@domain/domain.module';
import { IDENTITY_VERIFIER_TOKEN, MAIL_SENDER_TOKEN, PASSWORD_HASHER_TOKEN, SESSION_ISSUER_TOKEN } from '@domain/constants/inject-token.constant';
import { CloudflareAccessIdentityVerifier } from '@infrastructure/auth/cloudflare-access-identity.verifier';
import { JwtSessionIssuer } from '@infrastructure/auth/jwt-session.issuer';
import { PrincipalGuard } from '@infrastructure/auth/principal.guard';
import { ScopesGuard } from '@infrastructure/auth/scopes.guard';
import { Argon2PasswordHasher } from '@infrastructure/auth/argon2-password.hasher';
import { SessionCookieService } from '@infrastructure/auth/session-cookie.service';
import { NotConfiguredMailSender } from '@infrastructure/mail/not-configured-mail.sender';

@Module({
  imports: [
    EnvConfigModule,
    DomainModule,
    JwtModule.registerAsync({ imports: [EnvConfigModule], inject: [EnvConfigService], useFactory: (env: EnvConfigService) => ({ secret: env.requireJwtSecret() }) }),
  ],
  providers: [
    PrincipalGuard,
    ScopesGuard,
    SessionCookieService,
    { provide: PASSWORD_HASHER_TOKEN, useClass: Argon2PasswordHasher },
    { provide: MAIL_SENDER_TOKEN, useClass: NotConfiguredMailSender },
    { provide: IDENTITY_VERIFIER_TOKEN, useClass: CloudflareAccessIdentityVerifier },
    { provide: SESSION_ISSUER_TOKEN, useClass: JwtSessionIssuer },
  ],
  exports: [PrincipalGuard, ScopesGuard, SessionCookieService, PASSWORD_HASHER_TOKEN, MAIL_SENDER_TOKEN, JwtModule, DomainModule, IDENTITY_VERIFIER_TOKEN, SESSION_ISSUER_TOKEN, EnvConfigModule],
})
export class AuthModule {}
