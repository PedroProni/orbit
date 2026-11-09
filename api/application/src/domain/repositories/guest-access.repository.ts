import { GuestAccessEntity } from '@domain/entities/guest-access.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface GuestAccessRepository extends BaseRepository<GuestAccessEntity> {}
