import { UserCredentialEntity } from '@domain/entities/user-credential.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface UserCredentialRepository extends BaseRepository<UserCredentialEntity> {
  savePassword(userId: string, workspaceId: string, passwordHash: string, now: Date): Promise<void>;
}
