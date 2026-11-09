import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TaskDependency, TaskDependencyDocument } from '@infrastructure/database/schemas/task-dependency.schema';
import { TaskDependencyRepository } from '@domain/repositories/task-dependency.repository';
import { TaskDependencyEntity } from '@domain/entities/task-dependency.entity';
import { DomainTaskDependencyMapper } from '@domain/mappers/task-dependency.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class TaskDependencyPersistence extends BaseMongoPersistence<TaskDependencyEntity, TaskDependencyDocument> implements TaskDependencyRepository {
  constructor(@InjectModel(TaskDependency.name) model: Model<TaskDependencyDocument>) {
    super(model, DomainTaskDependencyMapper.toDomain, DomainTaskDependencyMapper.toPersistence);
  }
}
