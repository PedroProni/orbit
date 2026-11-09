import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { AUTH_TOKEN_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { ACCESS_TOKEN_BYTES, INVITE_TTL_SECONDS, RESET_TTL_SECONDS } from '@domain/constants/auth.constant';
import { AuthTokenRepository } from '@domain/repositories/auth-token.repository';
import { AuthTokenEntity } from '@domain/entities/auth-token.entity';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { UserEntity } from '@domain/entities/user.entity';
import { IssuedAccessLink } from '@domain/types/issued-access-link.type';
import { newId } from '@common/helpers/functions/id.helper';

@Injectable()
export class AccessLinkService {
  constructor(@Inject(AUTH_TOKEN_INJECT_TOKEN) private readonly tokens: AuthTokenRepository) {}

  static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issue(user: UserEntity, kind: AuthTokenKind, createdBy: string | null): Promise<IssuedAccessLink> {
    const now = new Date();
    const token = randomBytes(ACCESS_TOKEN_BYTES).toString('base64url');
    const ttl = kind === AuthTokenKind.INVITE ? INVITE_TTL_SECONDS : RESET_TTL_SECONDS;
    const expiresAt = new Date(now.getTime() + ttl * 1000);
    await this.tokens.invalidateUnused(user.getId(), [kind], now);
    await this.tokens.create(
      new AuthTokenEntity({
        _id: newId(),
        workspaceId: user.getWorkspaceId(),
        userId: user.getId(),
        kind,
        tokenHash: AccessLinkService.hash(token),
        expiresAt,
        usedAt: null,
        createdBy,
        createdAt: now,
        updatedAt: now,
      }),
    );
    return { token, kind, expiresAt };
  }
}
