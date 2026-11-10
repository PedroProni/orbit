import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '@infrastructure/database/schemas/user.schema';
import { UserRepository } from '@domain/repositories/user.repository';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRole } from '@domain/enums/user.enums';
import { DomainUserMapper } from '@domain/mappers/user.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class UserPersistence extends BaseMongoPersistence<UserEntity, UserDocument> implements UserRepository {
  constructor(@InjectModel(User.name) model: Model<UserDocument>) {
    super(model, DomainUserMapper.toDomain, DomainUserMapper.toPersistence);
  }

  async changeRoleIfCurrent(id: string, workspaceId: string, current: UserRole, next: UserRole): Promise<UserEntity | null> {
    const raw = await this.model
      .findOneAndUpdate({ _id: id, workspace_id: workspaceId, role: current } as any, { $set: { role: next, updated_at: new Date() } } as any, { new: true })
      .lean()
      .exec();
    return raw ? this.toDomain(raw) : null;
  }
}
