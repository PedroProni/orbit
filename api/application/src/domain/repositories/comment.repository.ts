import { CommentEntity } from '@domain/entities/comment.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface CommentRepository extends BaseRepository<CommentEntity> {}
