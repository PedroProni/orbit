import { TaskListEntity } from '@domain/entities/task-list.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface TaskListRepository extends BaseRepository<TaskListEntity> {}
