import { ClickupCommentReader } from './clickup-comment-reader';
import { ClickupReadonlyClient } from './clickup-readonly.client';
import { ATTACHMENT_LINK_TOKEN_PARAM } from './import.constant';

export class ClickupAttachmentLinks {
  constructor(private readonly client: ClickupReadonlyClient) {}

  static withoutToken(url: string): string {
    const parsed = new URL(url);
    parsed.searchParams.delete(ATTACHMENT_LINK_TOKEN_PARAM);
    return parsed.toString();
  }

  async forTask(taskId: string, includeComments: boolean): Promise<Map<string, string>> {
    const links = new Map<string, string>();
    const task = await this.client.get<any>(`/task/${taskId}`);
    for (const file of task.attachments ?? []) if (file?.url) links.set(String(file.id), file.url);
    if (!includeComments) return links;
    const { comments, replies } = await new ClickupCommentReader(this.client).read(taskId);
    for (const comment of [...comments, ...replies]) {
      for (const block of comment.comment ?? []) if (block?.attachment?.url) links.set(String(block.attachment.id), block.attachment.url);
    }
    return links;
  }
}
