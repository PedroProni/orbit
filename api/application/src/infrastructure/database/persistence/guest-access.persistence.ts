import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GuestAccess, GuestAccessDocument } from '@infrastructure/database/schemas/guest-access.schema';
import { GuestAccessRepository } from '@domain/repositories/guest-access.repository';
import { GuestAccessEntity } from '@domain/entities/guest-access.entity';
import { DomainGuestAccessMapper } from '@domain/mappers/guest-access.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class GuestAccessPersistence extends BaseMongoPersistence<GuestAccessEntity, GuestAccessDocument> implements GuestAccessRepository {
  constructor(@InjectModel(GuestAccess.name) model: Model<GuestAccessDocument>) {
    super(model, DomainGuestAccessMapper.toDomain, DomainGuestAccessMapper.toPersistence);
  }
}
