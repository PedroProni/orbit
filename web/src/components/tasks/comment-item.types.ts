import { Attachment, Member, TaskComment } from '@/types/api.types';

export interface CommentItemProps {
  taskId: string;
  comment: TaskComment;
  members: Member[];
  attachments: Attachment[];
  onRemoveAttachment: (id: string) => void;
}
