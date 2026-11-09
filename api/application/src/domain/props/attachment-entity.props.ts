

export interface AttachmentEntityProps {
  _id: string;
  workspaceId: string;
  taskId: string;
  commentId: string | null;
  storageKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  confirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
