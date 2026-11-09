import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PullRequestLink, PullRequestLinkDocument } from '@infrastructure/database/schemas/pull-request-link.schema';
import { PullRequestLinkRepository } from '@domain/repositories/pull-request-link.repository';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { DomainPullRequestLinkMapper } from '@domain/mappers/pull-request-link.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';
import { escapeRegex } from '@common/helpers/functions/regex.helper';

@Injectable()
export class PullRequestLinkPersistence extends BaseMongoPersistence<PullRequestLinkEntity, PullRequestLinkDocument> implements PullRequestLinkRepository {
  constructor(@InjectModel(PullRequestLink.name) model: Model<PullRequestLinkDocument>) {
    super(model, DomainPullRequestLinkMapper.toDomain, DomainPullRequestLinkMapper.toPersistence);
  }

  findForTask(taskId: string, repository: string, number: number): Promise<PullRequestLinkEntity | null> {
    return this.findOne({ task_id: taskId, number, repository: this.repositoryMatch(repository) });
  }

  findInRepository(repository: string, filter: Record<string, unknown>, limit: number): Promise<PullRequestLinkEntity[]> {
    return this.findMany({ ...filter, repository: this.repositoryMatch(repository) }, { updated_at: -1 }, limit);
  }

  private repositoryMatch(repository: string) {
    return { $regex: `^${escapeRegex(repository)}$`, $options: 'i' };
  }
}
