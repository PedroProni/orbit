import { createHash } from 'node:crypto';
import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { API_TOKEN_INJECT_TOKEN, AUTH_SESSION_INJECT_TOKEN, USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { ApiTokenRepository } from '@domain/repositories/api-token.repository';
import { UserRepository } from '@domain/repositories/user.repository';
import { AuthSessionRepository } from '@domain/repositories/auth-session.repository';
import { CSRF_HEADER, SAFE_HTTP_METHODS, SESSION_COOKIE_NAME } from '@domain/constants/auth.constant';
import { AUTH_ERROR } from '@domain/constants/auth-error.constant';
import { readCookie } from '@common/helpers/functions/cookie.helper';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { AuditActorType } from '@domain/enums/audit-log.enums';
import { ROLE_SCOPES } from '@domain/constants/scopes.constant';
import { API_TOKEN_PREFIX } from '@domain/constants/app.constant';
import { ALLOW_QUERY_SESSION_KEY } from '@infrastructure/auth/auth.constants';

@Injectable()
export class PrincipalGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    @Inject(API_TOKEN_INJECT_TOKEN) private readonly tokens: ApiTokenRepository,
    @Inject(AUTH_SESSION_INJECT_TOKEN) private readonly sessions: AuthSessionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const queryAllowed = this.reflector.get<boolean>(ALLOW_QUERY_SESSION_KEY, context.getHandler()) === true;
    const queryToken = queryAllowed && typeof request.query['access_token'] === 'string' ? (request.query['access_token'] as string) : '';
    if (queryToken && !request.headers['authorization']) {
      if (queryToken.startsWith(API_TOKEN_PREFIX)) throw new UnauthorizedException('API tokens are not accepted in the query string');
      (request as any).principal = await this.fromSession(queryToken);
      return true;
    }
    const header = request.headers['authorization']?.trim();
    if (!header) {
      const cookie = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
      if (!cookie) throw new UnauthorizedException('Missing authorization header');
      if (!SAFE_HTTP_METHODS.includes(request.method) && !request.headers[CSRF_HEADER]) throw new ForbiddenException(AUTH_ERROR.CSRF_HEADER_REQUIRED);
      (request as any).principal = await this.fromSession(cookie);
      return true;
    }
    const parts = header.split(/\s+/);
    const raw = parts.length === 2 && parts[0].toLowerCase() === 'bearer' ? parts[1] : parts.length === 1 ? parts[0] : '';
    if (!raw) throw new UnauthorizedException('Invalid authorization header format');
    (request as any).principal = raw.startsWith(API_TOKEN_PREFIX) ? await this.fromApiToken(raw) : await this.fromSession(raw);
    return true;
  }

  private async fromSession(raw: string): Promise<AuthPrincipal> {
    const payload = await this.jwt.verifyAsync<{ sub: string; ws: string; sid?: string }>(raw).catch(() => {
      throw new UnauthorizedException('Invalid or expired session');
    });
    if (!payload.sid) throw new UnauthorizedException('Invalid or expired session');
    const [session, user] = await Promise.all([this.sessions.findUsable(payload.sid, new Date()), this.users.findByIdInWorkspace(payload.sub, payload.ws)]);
    if (!session || session.getUserId() !== payload.sub) throw new UnauthorizedException('Invalid or expired session');
    if (!user || !user.isActive()) throw new UnauthorizedException('User not available');
    return {
      workspaceId: user.getWorkspaceId(),
      actorType: AuditActorType.USER,
      actorId: user.getId(),
      userId: user.getId(),
      role: user.getRole(),
      scopes: ROLE_SCOPES[user.getRole()],
      sessionId: session.getId(),
    };
  }

  private async fromApiToken(raw: string): Promise<AuthPrincipal> {
    const token = await this.tokens.findOne({ token_hash: createHash('sha256').update(raw).digest('hex') });
    if (!token || !token.isActive()) throw new UnauthorizedException('Invalid token');
    const user = await this.users.findByIdInWorkspace(token.getUserId(), token.getWorkspaceId());
    if (!user || !user.isActive()) throw new UnauthorizedException('Token owner not available');
    if (!(await this.tokens.touchIfActive(token.getId(), new Date()))) throw new UnauthorizedException('Invalid token');
    const roleScopes = ROLE_SCOPES[user.getRole()];
    return {
      workspaceId: token.getWorkspaceId(),
      actorType: AuditActorType.TOKEN,
      actorId: token.getId(),
      userId: user.getId(),
      role: user.getRole(),
      scopes: token.getScopes().filter(s => roleScopes.includes(s)),
    };
  }
}
