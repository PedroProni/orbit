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

  async touchIfActive(id: string, at: Date): Promise<boolean> {
    const result = await this.model.updateOne({ _id: id, revoked_at: null } as any, { $set: { last_used_at: at } } as any).exec();
    return result.matchedCount === 1;
  }

  async revokeIfActive(id: string, workspaceId: string, at: Date): Promise<boolean> {
    const result = await this.model.updateOne({ _id: id, workspace_id: workspaceId, revoked_at: null } as any, { $set: { revoked_at: at, updated_at: at } } as any).exec();
    return result.matchedCount === 1;
  }
}
