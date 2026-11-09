import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthSession, AuthSessionDocument } from '@infrastructure/database/schemas/auth-session.schema';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';
import { AuthSessionRepository } from '@domain/repositories/auth-session.repository';
import { AuthSessionEntity } from '@domain/entities/auth-session.entity';
import { DomainAuthSessionMapper } from '@domain/mappers/auth-session.mapper';

@Injectable()
export class AuthSessionPersistence extends BaseMongoPersistence<AuthSessionEntity, AuthSessionDocument> implements AuthSessionRepository {
  constructor(@InjectModel(AuthSession.name) model: Model<AuthSessionDocument>) {
    super(model, DomainAuthSessionMapper.toDomain, DomainAuthSessionMapper.toPersistence);
  }

  findUsable(id: string, now: Date): Promise<AuthSessionEntity | null> {
    return this.findOne({ _id: id, revoked_at: null, expires_at: { $gt: now } });
  }

  findUsableByUser(userId: string, now: Date): Promise<AuthSessionEntity[]> {
    return this.findMany({ user_id: userId, revoked_at: null, expires_at: { $gt: now } });
  }

  async revokeOwn(id: string, userId: string, now: Date): Promise<boolean> {
    const result = await this.model.updateOne({ _id: id, user_id: userId, revoked_at: null } as any, { $set: { revoked_at: now } } as any).exec();
    return result.modifiedCount === 1;
  }

  async revokeAllForUser(userId: string, exceptId: string | null, now: Date): Promise<number> {
    const filter: Record<string, unknown> = { user_id: userId, revoked_at: null };
    if (exceptId) filter._id = { $ne: exceptId };
    const result = await this.model.updateMany(filter as any, { $set: { revoked_at: now } } as any).exec();
    return result.modifiedCount;
  }
}
