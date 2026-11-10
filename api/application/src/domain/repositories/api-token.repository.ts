import { ApiTokenEntity } from '@domain/entities/api-token.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface ApiTokenRepository extends BaseRepository<ApiTokenEntity> {
  touchIfActive(id: string, at: Date): Promise<boolean>;
  revokeIfActive(id: string, workspaceId: string, at: Date): Promise<boolean>;
}
