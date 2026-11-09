import { AuthSessionEntity } from '@domain/entities/auth-session.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface AuthSessionRepository extends BaseRepository<AuthSessionEntity> {
  findUsable(id: string, now: Date): Promise<AuthSessionEntity | null>;
  findUsableByUser(userId: string, now: Date): Promise<AuthSessionEntity[]>;
  revokeOwn(id: string, userId: string, now: Date): Promise<boolean>;
  revokeAllForUser(userId: string, exceptId: string | null, now: Date): Promise<number>;
}
