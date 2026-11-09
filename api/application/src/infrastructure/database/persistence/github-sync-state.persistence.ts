import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GithubSyncState, GithubSyncStateDocument } from '@infrastructure/database/schemas/github-sync-state.schema';
import { GithubSyncStateRepository } from '@domain/repositories/github-sync-state.repository';
import { GithubSyncStateEntity } from '@domain/entities/github-sync-state.entity';
import { DomainGithubSyncStateMapper } from '@domain/mappers/github-sync-state.mapper';
import { DUPLICATE_KEY_CODE } from '@domain/constants/mongo-error.constant';
import { GithubSyncCursors } from '@domain/types/github-sync-cursors.type';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class GithubSyncStatePersistence extends BaseMongoPersistence<GithubSyncStateEntity, GithubSyncStateDocument> implements GithubSyncStateRepository {
  constructor(@InjectModel(GithubSyncState.name) model: Model<GithubSyncStateDocument>) {
    super(model, DomainGithubSyncStateMapper.toDomain, DomainGithubSyncStateMapper.toPersistence);
  }

  async claim(key: string, now: Date, holdMs: number): Promise<boolean> {
    try {
      const claimed = await this.model
        .findOneAndUpdate({ _id: key, $or: [{ locked_until: null }, { locked_until: { $lte: now } }] } as any, { $set: { locked_until: new Date(now.getTime() + holdMs) } } as any, {
          upsert: true,
          new: true,
        })
        .lean()
        .exec();
      return claimed !== null;
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY_CODE) return false;
      throw error;
    }
  }

  async finish(key: string, now: Date, cursors: GithubSyncCursors): Promise<void> {
    const set: Record<string, unknown> = { last_success_at: now };
    if (cursors.pullCursor) set.pull_cursor = cursors.pullCursor;
    if (cursors.commitCursor) set.commit_cursor = cursors.commitCursor;
    await this.model.updateOne({ _id: key } as any, { $set: set }).exec();
  }

  async release(key: string): Promise<void> {
    await this.model.updateOne({ _id: key } as any, { $set: { locked_until: null } }).exec();
  }

  async lastSuccess(keys: string[]): Promise<Date | null> {
    if (!keys.length) return null;
    const row = await this.model
      .findOne({ _id: { $in: keys }, last_success_at: { $ne: null } } as any)
      .sort({ last_success_at: -1 })
      .lean()
      .exec();
    return (row as { last_success_at?: Date } | null)?.last_success_at ?? null;
  }
}
