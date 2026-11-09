import { TaskDependencyEntity } from '@domain/entities/task-dependency.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface TaskDependencyRepository extends BaseRepository<TaskDependencyEntity> {}
