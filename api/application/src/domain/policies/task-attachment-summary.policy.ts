import { ATTACHMENT_GALLERY_MIME_PREFIX } from '@domain/constants/attachment.constant';
import { TaskAttachmentItem } from '@domain/types/task-attachment-item.type';
import { TaskAttachmentSummary } from '@domain/types/task-attachment-summary.type';
import { AttachmentContentPolicy } from '@domain/policies/attachment-content.policy';

export class TaskAttachmentSummaryPolicy {
  static summarize(items: TaskAttachmentItem[], descriptionMd: string, guest: boolean): TaskAttachmentSummary {
    const visible = guest ? items.filter(item => AttachmentContentPolicy.guestCanSeeRef(descriptionMd, item.id, item.gallery)) : items;
    const cover = visible.find(item => item.commentId === null && item.mimeType.trim().toLowerCase().startsWith(ATTACHMENT_GALLERY_MIME_PREFIX));
    return { attachmentCount: visible.length, coverAttachmentId: cover?.id ?? null };
  }
}
