import { AttachmentEntity } from '@domain/entities/attachment.entity';
import { BaseRepository } from '@domain/repositories/base.repository';
import { TaskAttachmentItem } from '@domain/types/task-attachment-item.type';

export interface AttachmentRepository extends BaseRepository<AttachmentEntity> {
  confirmedItemsByTask(workspaceId: string, taskIds: string[]): Promise<Map<string, TaskAttachmentItem[]>>;
}
