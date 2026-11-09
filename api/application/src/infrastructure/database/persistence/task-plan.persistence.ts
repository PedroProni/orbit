import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TaskPlan, TaskPlanDocument } from '@infrastructure/database/schemas/task-plan.schema';
import { TaskPlanRepository } from '@domain/repositories/task-plan.repository';
import { TaskPlanEntity } from '@domain/entities/task-plan.entity';
import { DomainTaskPlanMapper } from '@domain/mappers/task-plan.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class TaskPlanPersistence extends BaseMongoPersistence<TaskPlanEntity, TaskPlanDocument> implements TaskPlanRepository {
  constructor(@InjectModel(TaskPlan.name) model: Model<TaskPlanDocument>) {
    super(model, DomainTaskPlanMapper.toDomain, DomainTaskPlanMapper.toPersistence);
  }
}
