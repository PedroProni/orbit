import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ApiToken, ApiTokenDocument } from '@infrastructure/database/schemas/api-token.schema';
import { ApiTokenRepository } from '@domain/repositories/api-token.repository';
import { ApiTokenEntity } from '@domain/entities/api-token.entity';
import { DomainApiTokenMapper } from '@domain/mappers/api-token.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class ApiTokenPersistence extends BaseMongoPersistence<ApiTokenEntity, ApiTokenDocument> implements ApiTokenRepository {
  constructor(@InjectModel(ApiToken.name) model: Model<ApiTokenDocument>) {
    super(model, DomainApiTokenMapper.toDomain, DomainApiTokenMapper.toPersistence);
  }
}
