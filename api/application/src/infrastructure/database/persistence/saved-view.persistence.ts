import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SavedView, SavedViewDocument } from '@infrastructure/database/schemas/saved-view.schema';
import { SavedViewRepository } from '@domain/repositories/saved-view.repository';
import { SavedViewEntity } from '@domain/entities/saved-view.entity';
import { DomainSavedViewMapper } from '@domain/mappers/saved-view.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class SavedViewPersistence extends BaseMongoPersistence<SavedViewEntity, SavedViewDocument> implements SavedViewRepository {
  constructor(@InjectModel(SavedView.name) model: Model<SavedViewDocument>) {
    super(model, DomainSavedViewMapper.toDomain, DomainSavedViewMapper.toPersistence);
  }
}
