import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PullRequestLink, PullRequestLinkDocument } from '@infrastructure/database/schemas/pull-request-link.schema';
import { PullRequestLinkRepository } from '@domain/repositories/pull-request-link.repository';
import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { DomainPullRequestLinkMapper } from '@domain/mappers/pull-request-link.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class PullRequestLinkPersistence extends BaseMongoPersistence<PullRequestLinkEntity, PullRequestLinkDocument> implements PullRequestLinkRepository {
  constructor(@InjectModel(PullRequestLink.name) model: Model<PullRequestLinkDocument>) {
    super(model, DomainPullRequestLinkMapper.toDomain, DomainPullRequestLinkMapper.toPersistence);
  }
}
