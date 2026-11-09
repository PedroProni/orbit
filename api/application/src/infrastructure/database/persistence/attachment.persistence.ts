import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Attachment, AttachmentDocument } from '@infrastructure/database/schemas/attachment.schema';
import { AttachmentRepository } from '@domain/repositories/attachment.repository';
import { AttachmentEntity } from '@domain/entities/attachment.entity';
import { DomainAttachmentMapper } from '@domain/mappers/attachment.mapper';
import { TaskAttachmentItem } from '@domain/types/task-attachment-item.type';
import { TaskAttachmentGroupFacet } from '@domain/types/task-attachment-group-facet.type';
import { BaseMongoPersistence } from '@infrastructure/database/persistence/base-mongo.persistence';

@Injectable()
export class AttachmentPersistence extends BaseMongoPersistence<AttachmentEntity, AttachmentDocument> implements AttachmentRepository {
  constructor(@InjectModel(Attachment.name) model: Model<AttachmentDocument>) {
    super(model, DomainAttachmentMapper.toDomain, DomainAttachmentMapper.toPersistence);
  }

  async confirmedItemsByTask(workspaceId: string, taskIds: string[]): Promise<Map<string, TaskAttachmentItem[]>> {
    if (taskIds.length === 0) return new Map();
    const groups = await this.model
      .aggregate<TaskAttachmentGroupFacet>([
        { $match: { workspace_id: workspaceId, task_id: { $in: taskIds }, confirmed: true } },
        { $sort: { created_at: 1, _id: 1 } },
        { $group: { _id: '$task_id', items: { $push: { id: '$_id', mimeType: '$mime_type', commentId: { $ifNull: ['$comment_id', null] }, gallery: { $ifNull: ['$gallery', null] } } } } },
      ])
      .exec();
    return new Map(groups.map(group => [group._id, group.items]));
  }
}
