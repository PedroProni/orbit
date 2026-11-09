export class AttachmentContentPolicy {
  static path(attachmentId: string): string {
    return `/attachments/${attachmentId}/content`;
  }

  static isShownIn(text: string, attachmentId: string): boolean {
    return text.includes(AttachmentContentPolicy.path(attachmentId));
  }
}
