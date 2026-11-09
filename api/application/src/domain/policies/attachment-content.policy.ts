import { AttachmentEntity } from '@domain/entities/attachment.entity';

export class AttachmentContentPolicy {
  static path(attachmentId: string): string {
    return `/attachments/${attachmentId}/content`;
  }

  static guestCanSee(descriptionMd: string, attachment: AttachmentEntity): boolean {
    return attachment.isPrint() || AttachmentContentPolicy.isShownIn(descriptionMd, attachment.getId());
  }

  static isShownIn(text: string, attachmentId: string): boolean {
    return text.includes(AttachmentContentPolicy.path(attachmentId));
  }
}
