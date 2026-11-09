import { UserEntity } from '@domain/entities/user.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface UserRepository extends BaseRepository<UserEntity> {}
