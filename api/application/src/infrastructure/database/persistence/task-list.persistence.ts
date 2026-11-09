import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TaskList, TaskListDocument } from '@infrastructure/database/schemas/task-list.schema';
import { TaskListRepository } from '@domain/repositories/task-list.repository';
import { TaskListEntity } from '@domain/entities/task-list.entity';
import { DomainTaskListMapper } from '@domain/mappers/task-list.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class TaskListPersistence extends BaseMongoPersistence<TaskListEntity, TaskListDocument> implements TaskListRepository {
  constructor(@InjectModel(TaskList.name) model: Model<TaskListDocument>) {
    super(model, DomainTaskListMapper.toDomain, DomainTaskListMapper.toPersistence);
  }
}
