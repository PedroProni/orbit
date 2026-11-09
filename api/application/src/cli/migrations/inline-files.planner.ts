import { AttachmentContentPolicy } from '@domain/policies/attachment-content.policy';
import { ClickupAttachmentLinks } from '../import/clickup-attachment-links';
import { FALLBACK_LABEL, IMAGE_MIME_PREFIX, INLINE_FILE_URL_GLOBAL_PATTERN, LABEL_FORBIDDEN_PATTERN, LABEL_REPEATED_SPACE_PATTERN } from './inline-files.constant';
import { InlineFileAttachment, InlineFileChange, InlineFileLink, InlineFileOwner, InlineFilePlan, InlineFileSource, InlineFileUnmatched } from './inline-files.type';

export class InlineFilesPlanner {
  static plan(owners: InlineFileOwner[], sources: InlineFileSource[], attachments: InlineFileAttachment[]): InlineFilePlan {
    const sourceByUrl = new Map(sources.map((source) => [source.url, source.id]));
    const attachmentById = new Map(attachments.map((attachment) => [attachment.id, attachment]));
    const changes: InlineFileChange[] = [];
    const unmatched: InlineFileUnmatched[] = [];
    for (const owner of owners) {
      const links: InlineFileLink[] = [];
      const after = owner.text.replace(INLINE_FILE_URL_GLOBAL_PATTERN, (url: string, offset: number) => {
        const attachmentId = sourceByUrl.get(InlineFilesPlanner.normalize(url));
        if (!attachmentId) return InlineFilesPlanner.refuse(unmatched, owner, url, 'no-source');
        const attachment = attachmentById.get(attachmentId);
        if (!attachment || !attachment.confirmed) return InlineFilesPlanner.refuse(unmatched, owner, url, 'not-stored');
        if (attachment.taskId !== owner.taskId) return InlineFilesPlanner.refuse(unmatched, owner, url, 'other-task');
        links.push({ url: InlineFilesPlanner.normalize(url), attachmentId });
        const path = InlineFilesPlanner.path(attachmentId);
        return owner.text.slice(Math.max(0, offset - 2), offset) === '](' ? path : InlineFilesPlanner.markdown(attachment, path);
      });
      if (links.length > 0) changes.push({ kind: owner.kind, id: owner.id, workspaceId: owner.workspaceId, taskId: owner.taskId, before: owner.text, after, links });
    }
    return { changes, unmatched, links: changes.reduce((sum, change) => sum + change.links.length, 0) };
  }

  static path(attachmentId: string): string {
    return AttachmentContentPolicy.path(attachmentId);
  }

  private static normalize(url: string): string {
    return ClickupAttachmentLinks.withoutToken(url);
  }

  private static markdown(attachment: InlineFileAttachment, path: string): string {
    const label = attachment.filename.replace(LABEL_FORBIDDEN_PATTERN, ' ').replace(LABEL_REPEATED_SPACE_PATTERN, ' ').trim() || FALLBACK_LABEL;
    return `${attachment.mimeType.startsWith(IMAGE_MIME_PREFIX) ? '!' : ''}[${label}](${path})`;
  }

  private static refuse(unmatched: InlineFileUnmatched[], owner: InlineFileOwner, url: string, reason: InlineFileUnmatched['reason']): string {
    unmatched.push({ kind: owner.kind, id: owner.id, url, reason });
    return url;
  }
}
