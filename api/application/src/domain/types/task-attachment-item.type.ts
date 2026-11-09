import { AttachmentGallery } from '@domain/enums/attachment.enums';

export interface TaskAttachmentItem {
  id: string;
  mimeType: string;
  commentId: string | null;
  gallery: AttachmentGallery | null;
}
