import { AttachmentEntity } from '@domain/entities/attachment.entity';
import { AttachmentGallery } from '@domain/enums/attachment.enums';

export class AttachmentContentPolicy {
  static path(attachmentId: string): string {
    return `/attachments/${attachmentId}/content`;
  }

  static guestCanSee(descriptionMd: string, attachment: AttachmentEntity): boolean {
    return attachment.isPrint() || AttachmentContentPolicy.isShownIn(descriptionMd, attachment.getId());
  }

  static guestCanSeeRef(descriptionMd: string, attachmentId: string, gallery: AttachmentGallery | null): boolean {
    return gallery === AttachmentGallery.PRINTS || AttachmentContentPolicy.isShownIn(descriptionMd, attachmentId);
  }

  static isShownIn(text: string, attachmentId: string): boolean {
    return text.includes(AttachmentContentPolicy.path(attachmentId));
  }
}
