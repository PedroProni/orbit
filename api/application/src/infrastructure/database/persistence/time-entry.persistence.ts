import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { TimeEntry, TimeEntryDocument } from '@infrastructure/database/schemas/time-entry.schema';
import { TimeEntryRepository } from '@domain/repositories/time-entry.repository';
import { TimeEntryEntity } from '@domain/entities/time-entry.entity';
import { DomainTimeEntryMapper } from '@domain/mappers/time-entry.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class TimeEntryPersistence extends BaseMongoPersistence<TimeEntryEntity, TimeEntryDocument> implements TimeEntryRepository {
  constructor(@InjectModel(TimeEntry.name) model: Model<TimeEntryDocument>) {
    super(model, DomainTimeEntryMapper.toDomain, DomainTimeEntryMapper.toPersistence);
  }
}
