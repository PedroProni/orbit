import { GuestReadable } from '@infrastructure/auth/guest-readable.decorator';
import { Body, Controller, Delete, Get, Header, Headers, HttpCode, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Authenticated } from '@infrastructure/auth/authenticated.decorator';
import { CurrentPrincipal } from '@infrastructure/auth/current-principal.decorator';
import { ClientContext } from '@infrastructure/auth/client-context.decorator';
import { SessionCookieService } from '@infrastructure/auth/session-cookie.service';
import { DevLoginEnabledGuard } from '@infrastructure/auth/dev-login-enabled.guard';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { SessionContext } from '@domain/types/session-context.type';
import { LoginAccessUseCase } from '@application/use-cases/auth/login-access.use-case';
import { DevLoginUseCase } from '@application/use-cases/auth/dev-login.use-case';
import { GetMeUseCase } from '@application/use-cases/auth/get-me.use-case';
import { PasswordLoginUseCase } from '@application/use-cases/auth/password-login.use-case';
import { LogoutUseCase } from '@application/use-cases/auth/logout.use-case';
import { ListSessionsUseCase } from '@application/use-cases/auth/list-sessions.use-case';
import { RevokeSessionUseCase } from '@application/use-cases/auth/revoke-session.use-case';
import { ForgotPasswordUseCase } from '@application/use-cases/auth/forgot-password.use-case';
import { CheckAccessLinkUseCase } from '@application/use-cases/auth/check-access-link.use-case';
import { SetPasswordUseCase } from '@application/use-cases/auth/set-password.use-case';
import { ChangePasswordUseCase } from '@application/use-cases/auth/change-password.use-case';
import { DevLoginDto } from '@shared/dtos/auth/dev-login.dto';
import { PasswordLoginDto } from '@shared/dtos/auth/password-login.dto';
import { ForgotPasswordDto } from '@shared/dtos/auth/forgot-password.dto';
import { AccessLinkTokenDto } from '@shared/dtos/auth/access-link-token.dto';
import { SetPasswordDto } from '@shared/dtos/auth/set-password.dto';
import { ChangePasswordDto } from '@shared/dtos/auth/change-password.dto';
import { CF_ACCESS_COOKIE, CF_ACCESS_JWT_HEADER } from '@domain/constants/cloudflare-access.constant';
import { readCookie } from '@common/helpers/functions/cookie.helper';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginAccess: LoginAccessUseCase,
    private readonly devLogin: DevLoginUseCase,
    private readonly getMe: GetMeUseCase,
    private readonly passwordLogin: PasswordLoginUseCase,
    private readonly logoutSession: LogoutUseCase,
    private readonly listSessions: ListSessionsUseCase,
    private readonly revokeSession: RevokeSessionUseCase,
    private readonly forgotPassword: ForgotPasswordUseCase,
    private readonly checkLink: CheckAccessLinkUseCase,
    private readonly setPassword: SetPasswordUseCase,
    private readonly changePassword: ChangePasswordUseCase,
    private readonly cookie: SessionCookieService,
  ) {}

  @Post('access')
  @HttpCode(200)
  async access(@ClientContext() context: SessionContext, @Res({ passthrough: true }) response: Response, @Headers(CF_ACCESS_JWT_HEADER) assertion?: string, @Headers('cookie') cookies?: string) {
    const result = await this.loginAccess.execute({ assertion: assertion || readCookie(cookies, CF_ACCESS_COOKIE) }, context);
    this.cookie.set(response, result.accessToken);
    return result;
  }

  @Post('dev-login')
  @UseGuards(DevLoginEnabledGuard)
  @HttpCode(200)
  async dev(@Body() dto: DevLoginDto, @ClientContext() context: SessionContext, @Res({ passthrough: true }) response: Response) {
    const result = await this.devLogin.execute(dto, context);
    this.cookie.set(response, result.accessToken);
    return result;
  }

  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async login(@Body() dto: PasswordLoginDto, @ClientContext() context: SessionContext, @Res({ passthrough: true }) response: Response) {
    const { token, user } = await this.passwordLogin.execute({ email: dto.email, password: dto.password, context });
    this.cookie.set(response, token);
    return { user };
  }

  @Post('logout')
  @HttpCode(204)
  @GuestReadable()
  @Authenticated()
  async logout(@CurrentPrincipal() principal: AuthPrincipal, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.logoutSession.execute(principal);
    this.cookie.clear(response);
  }

  @Post('password/forgot')
  @HttpCode(202)
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.forgotPassword.execute(dto.email);
  }

  @Post('password/link')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  link(@Body() dto: AccessLinkTokenDto) {
    return this.checkLink.execute(dto.token);
  }

  @Post('password/set')
  @HttpCode(204)
  async set(@Body() dto: SetPasswordDto): Promise<void> {
    await this.setPassword.execute(dto);
  }

  @Post('password/change')
  @HttpCode(200)
  @GuestReadable()
  @Authenticated()
  change(@CurrentPrincipal() principal: AuthPrincipal, @Body() dto: ChangePasswordDto) {
    return this.changePassword.execute(principal, dto);
  }

  @Get('sessions')
  @GuestReadable()
  @Authenticated()
  sessions(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.listSessions.execute(principal);
  }

  @Post('sessions/revoke-others')
  @HttpCode(200)
  @GuestReadable()
  @Authenticated()
  revokeOthers(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.revokeSession.others(principal);
  }

  @Delete('sessions/:id')
  @GuestReadable()
  @Authenticated()
  async revoke(@CurrentPrincipal() principal: AuthPrincipal, @Param('id') id: string, @Res({ passthrough: true }) response: Response) {
    const result = await this.revokeSession.one(principal, id);
    if (result.current) this.cookie.clear(response);
    return result;
  }

  @Get('me')
  @GuestReadable()
  @Authenticated()
  me(@CurrentPrincipal() principal: AuthPrincipal) {
    return this.getMe.execute(principal);
  }
}
