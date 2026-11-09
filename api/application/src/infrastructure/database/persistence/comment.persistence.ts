import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument } from '@infrastructure/database/schemas/comment.schema';
import { CommentRepository } from '@domain/repositories/comment.repository';
import { CommentEntity } from '@domain/entities/comment.entity';
import { DomainCommentMapper } from '@domain/mappers/comment.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class CommentPersistence extends BaseMongoPersistence<CommentEntity, CommentDocument> implements CommentRepository {
  constructor(@InjectModel(Comment.name) model: Model<CommentDocument>) {
    super(model, DomainCommentMapper.toDomain, DomainCommentMapper.toPersistence);
  }
}
