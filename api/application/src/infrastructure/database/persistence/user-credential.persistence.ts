import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserCredential, UserCredentialDocument } from '@infrastructure/database/schemas/user-credential.schema';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';
import { UserCredentialRepository } from '@domain/repositories/user-credential.repository';
import { UserCredentialEntity } from '@domain/entities/user-credential.entity';
import { DomainUserCredentialMapper } from '@domain/mappers/user-credential.mapper';

@Injectable()
export class UserCredentialPersistence extends BaseMongoPersistence<UserCredentialEntity, UserCredentialDocument> implements UserCredentialRepository {
  constructor(@InjectModel(UserCredential.name) model: Model<UserCredentialDocument>) {
    super(model, DomainUserCredentialMapper.toDomain, DomainUserCredentialMapper.toPersistence);
  }

  async savePassword(userId: string, workspaceId: string, passwordHash: string, now: Date): Promise<void> {
    await this.model.updateOne({ _id: userId } as any, { $set: { workspace_id: workspaceId, password_hash: passwordHash, password_changed_at: now } } as any, { upsert: true }).exec();
  }
}
