import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Attachment, AttachmentDocument } from '@infrastructure/database/schemas/attachment.schema';
import { AttachmentRepository } from '@domain/repositories/attachment.repository';
import { AttachmentEntity } from '@domain/entities/attachment.entity';
import { DomainAttachmentMapper } from '@domain/mappers/attachment.mapper';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class AttachmentPersistence extends BaseMongoPersistence<AttachmentEntity, AttachmentDocument> implements AttachmentRepository {
  constructor(@InjectModel(Attachment.name) model: Model<AttachmentDocument>) {
    super(model, DomainAttachmentMapper.toDomain, DomainAttachmentMapper.toPersistence);
  }
}
