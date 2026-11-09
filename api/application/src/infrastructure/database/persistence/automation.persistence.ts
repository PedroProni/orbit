import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Automation, AutomationDocument } from '@infrastructure/database/schemas/automation.schema';
import { AutomationRepository } from '@domain/repositories/automation.repository';
import { AutomationEntity } from '@domain/entities/automation.entity';
import { DomainAutomationMapper } from '@domain/mappers/automation.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class AutomationPersistence extends BaseMongoPersistence<AutomationEntity, AutomationDocument> implements AutomationRepository {
  constructor(@InjectModel(Automation.name) model: Model<AutomationDocument>) {
    super(model, DomainAutomationMapper.toDomain, DomainAutomationMapper.toPersistence);
  }
}
