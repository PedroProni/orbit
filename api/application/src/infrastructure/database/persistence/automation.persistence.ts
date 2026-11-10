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

  async moveDateCursor(id: string, armedAt: Date, cursor: Date): Promise<void> {
    await this.model.updateOne({ _id: id, $or: [{ armed_at: armedAt }, { armed_at: null }] } as any, { $set: { date_cursor: cursor } }, { timestamps: false }).exec();
  }
}
