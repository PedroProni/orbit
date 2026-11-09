import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthToken, AuthTokenDocument } from '@infrastructure/database/schemas/auth-token.schema';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';
import { AuthTokenRepository } from '@domain/repositories/auth-token.repository';
import { AuthTokenEntity } from '@domain/entities/auth-token.entity';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';
import { DomainAuthTokenMapper } from '@domain/mappers/auth-token.mapper';

@Injectable()
export class AuthTokenPersistence extends BaseMongoPersistence<AuthTokenEntity, AuthTokenDocument> implements AuthTokenRepository {
  constructor(@InjectModel(AuthToken.name) model: Model<AuthTokenDocument>) {
    super(model, DomainAuthTokenMapper.toDomain, DomainAuthTokenMapper.toPersistence);
  }

  findUsable(tokenHash: string, now: Date): Promise<AuthTokenEntity | null> {
    return this.findOne({ token_hash: tokenHash, used_at: null, expires_at: { $gt: now } });
  }

  async consume(tokenHash: string, now: Date): Promise<AuthTokenEntity | null> {
    const raw = await this.model
      .findOneAndUpdate({ token_hash: tokenHash, used_at: null, expires_at: { $gt: now } } as any, { $set: { used_at: now } } as any, { new: true })
      .lean()
      .exec();
    return raw ? this.toDomain(raw) : null;
  }

  async invalidateUnused(userId: string, kinds: AuthTokenKind[], now: Date): Promise<void> {
    await this.model.updateMany({ user_id: userId, kind: { $in: kinds }, used_at: null } as any, { $set: { used_at: now } } as any).exec();
  }
}
