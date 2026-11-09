import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionIssuer } from '@domain/services/session-issuer.service';
import { SESSION_TTL_SECONDS } from '@domain/constants/app.constant';
import { AUTH_SESSION_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { AuthSessionRepository } from '@domain/repositories/auth-session.repository';
import { AuthSessionEntity } from '@domain/entities/auth-session.entity';
import { SessionContext } from '@domain/types/session-context.type';
import { newId } from '@common/helpers/functions/id.helper';

@Injectable()
export class JwtSessionIssuer implements SessionIssuer {
  constructor(
    private readonly jwt: JwtService,
    @Inject(AUTH_SESSION_INJECT_TOKEN) private readonly sessions: AuthSessionRepository,
  ) {}

  async issue(userId: string, workspaceId: string, context: SessionContext = { ip: null, userAgent: null }): Promise<string> {
    const now = new Date();
    const session = await this.sessions.create(
      new AuthSessionEntity({
        _id: newId(),
        workspaceId,
        userId,
        ip: context.ip,
        userAgent: context.userAgent,
        expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
        revokedAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    );
    return this.jwt.signAsync({ sub: userId, ws: workspaceId, sid: session.getId() }, { expiresIn: SESSION_TTL_SECONDS });
  }
}
