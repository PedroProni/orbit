import { DashboardEntity } from '@domain/entities/dashboard.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface DashboardRepository extends BaseRepository<DashboardEntity> {}
