import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { GithubRef, GithubRefDocument } from '@infrastructure/database/schemas/github-ref.schema';
import { GithubRefRepository } from '@domain/repositories/github-ref.repository';
import { GithubRefEntity } from '@domain/entities/github-ref.entity';
import { GithubRefKind } from '@domain/enums/github.enums';
import { DomainGithubRefMapper } from '@domain/mappers/github-ref.mapper';
import { DUPLICATE_KEY_CODE } from '@domain/constants/mongo-error.constant';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class GithubRefPersistence extends BaseMongoPersistence<GithubRefEntity, GithubRefDocument> implements GithubRefRepository {
  constructor(@InjectModel(GithubRef.name) model: Model<GithubRefDocument>) {
    super(model, DomainGithubRefMapper.toDomain, DomainGithubRefMapper.toPersistence);
  }

  async upsertRef(entity: GithubRefEntity): Promise<void> {
    const raw = this.toPersistence(entity);
    const filter = { task_id: raw.task_id, repository: raw.repository, kind: raw.kind, key: raw.key };
    const update = {
      $set: { title: raw.title, url: raw.url, author_login: raw.author_login, occurred_at: raw.occurred_at },
      $setOnInsert: { _id: raw._id, workspace_id: raw.workspace_id },
    };
    try {
      await this.model.updateOne(filter as any, update, { upsert: true }).exec();
    } catch (error) {
      if ((error as { code?: number }).code !== DUPLICATE_KEY_CODE) throw error;
      await this.model.updateOne(filter as any, { $set: update.$set }).exec();
    }
  }

  async removeBranchesNotIn(repository: string, keep: string[], seenBefore: Date): Promise<number> {
    const result = await this.model.deleteMany({ repository, kind: GithubRefKind.BRANCH, key: { $nin: keep }, updated_at: { $lt: seenBefore } } as any).exec();
    return result.deletedCount ?? 0;
  }

  async removeBranch(repository: string, name: string): Promise<number> {
    const result = await this.model.deleteMany({ repository, kind: GithubRefKind.BRANCH, key: name } as any).exec();
    return result.deletedCount ?? 0;
  }
}
