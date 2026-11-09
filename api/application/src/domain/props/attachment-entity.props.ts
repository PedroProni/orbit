import { AttachmentGallery } from '@domain/enums/attachment.enums';

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
  gallery: AttachmentGallery | null;
  createdAt: Date;
  updatedAt: Date;
}
