import { TaskAttachmentItem } from '@domain/types/task-attachment-item.type';

export interface TaskAttachmentGroupFacet {
  _id: string;
  items: TaskAttachmentItem[];
}
