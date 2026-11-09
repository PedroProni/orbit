import { AuthTokenEntity } from '@domain/entities/auth-token.entity';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface AuthTokenRepository extends BaseRepository<AuthTokenEntity> {
  findUsable(tokenHash: string, now: Date): Promise<AuthTokenEntity | null>;
  consume(tokenHash: string, now: Date): Promise<AuthTokenEntity | null>;
  invalidateUnused(userId: string, kinds: AuthTokenKind[], now: Date): Promise<void>;
}
