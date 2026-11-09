import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TaskTemplate, TaskTemplateDocument } from '@infrastructure/database/schemas/task-template.schema';
import { TaskTemplateRepository } from '@domain/repositories/task-template.repository';
import { TaskTemplateEntity } from '@domain/entities/task-template.entity';
import { DomainTaskTemplateMapper } from '@domain/mappers/task-template.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class TaskTemplatePersistence extends BaseMongoPersistence<TaskTemplateEntity, TaskTemplateDocument> implements TaskTemplateRepository {
  constructor(@InjectModel(TaskTemplate.name) model: Model<TaskTemplateDocument>) {
    super(model, DomainTaskTemplateMapper.toDomain, DomainTaskTemplateMapper.toPersistence);
  }
}
