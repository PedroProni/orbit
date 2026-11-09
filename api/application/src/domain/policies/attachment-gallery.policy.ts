import { ATTACHMENT_GALLERY_MIME_PREFIX } from '@domain/constants/attachment.constant';
import { AttachmentGallery } from '@domain/enums/attachment.enums';

export class AttachmentGalleryPolicy {
  static accepts(gallery: AttachmentGallery | null, mimeType: string, commentId: string | null): boolean {
    if (gallery === null) return true;
    return commentId === null && mimeType.trim().toLowerCase().startsWith(ATTACHMENT_GALLERY_MIME_PREFIX);
  }
}
