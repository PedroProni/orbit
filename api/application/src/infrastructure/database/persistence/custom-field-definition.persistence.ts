import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CustomFieldDefinition, CustomFieldDefinitionDocument } from '@infrastructure/database/schemas/custom-field-definition.schema';
import { CustomFieldDefinitionRepository } from '@domain/repositories/custom-field-definition.repository';
import { CustomFieldDefinitionEntity } from '@domain/entities/custom-field-definition.entity';
import { DomainCustomFieldDefinitionMapper } from '@domain/mappers/custom-field-definition.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class CustomFieldDefinitionPersistence extends BaseMongoPersistence<CustomFieldDefinitionEntity, CustomFieldDefinitionDocument> implements CustomFieldDefinitionRepository {
  constructor(@InjectModel(CustomFieldDefinition.name) model: Model<CustomFieldDefinitionDocument>) {
    super(model, DomainCustomFieldDefinitionMapper.toDomain, DomainCustomFieldDefinitionMapper.toPersistence);
  }
}
