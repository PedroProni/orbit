import { GoalEntity } from '@domain/entities/goal.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface GoalRepository extends BaseRepository<GoalEntity> {}
