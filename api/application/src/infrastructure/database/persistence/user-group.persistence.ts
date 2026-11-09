import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserGroup, UserGroupDocument } from '@infrastructure/database/schemas/user-group.schema';
import { UserGroupRepository } from '@domain/repositories/user-group.repository';
import { UserGroupEntity } from '@domain/entities/user-group.entity';
import { DomainUserGroupMapper } from '@domain/mappers/user-group.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class UserGroupPersistence extends BaseMongoPersistence<UserGroupEntity, UserGroupDocument> implements UserGroupRepository {
  constructor(@InjectModel(UserGroup.name) model: Model<UserGroupDocument>) {
    super(model, DomainUserGroupMapper.toDomain, DomainUserGroupMapper.toPersistence);
  }
}
