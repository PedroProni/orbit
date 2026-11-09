

export interface CommentEntityProps {
  _id: string;
  workspaceId: string;
  taskId: string;
  authorId: string;
  bodyMd: string;
  mentionIds: string[];
  attachmentIds: string[];
  dailyLogDate: string | null;
  editedAt: Date | null;
  clickupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
