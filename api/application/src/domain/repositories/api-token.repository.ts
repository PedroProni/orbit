import { ApiTokenEntity } from '@domain/entities/api-token.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface ApiTokenRepository extends BaseRepository<ApiTokenEntity> {}
