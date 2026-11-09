import { TaskTemplateEntity } from '@domain/entities/task-template.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface TaskTemplateRepository extends BaseRepository<TaskTemplateEntity> {}
