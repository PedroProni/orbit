import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Space, SpaceDocument } from '@infrastructure/database/schemas/space.schema';
import { SpaceRepository } from '@domain/repositories/space.repository';
import { SpaceEntity } from '@domain/entities/space.entity';
import { DomainSpaceMapper } from '@domain/mappers/space.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class SpacePersistence extends BaseMongoPersistence<SpaceEntity, SpaceDocument> implements SpaceRepository {
  constructor(@InjectModel(Space.name) model: Model<SpaceDocument>) {
    super(model, DomainSpaceMapper.toDomain, DomainSpaceMapper.toPersistence);
  }
}
