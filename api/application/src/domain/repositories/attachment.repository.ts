import { AttachmentEntity } from '@domain/entities/attachment.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface AttachmentRepository extends BaseRepository<AttachmentEntity> {}
