import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Goal, GoalDocument } from '@infrastructure/database/schemas/goal.schema';
import { GoalRepository } from '@domain/repositories/goal.repository';
import { GoalEntity } from '@domain/entities/goal.entity';
import { DomainGoalMapper } from '@domain/mappers/goal.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class GoalPersistence extends BaseMongoPersistence<GoalEntity, GoalDocument> implements GoalRepository {
  constructor(@InjectModel(Goal.name) model: Model<GoalDocument>) {
    super(model, DomainGoalMapper.toDomain, DomainGoalMapper.toPersistence);
  }
}
