import { TaskPlanEntity } from '@domain/entities/task-plan.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface TaskPlanRepository extends BaseRepository<TaskPlanEntity> {}
