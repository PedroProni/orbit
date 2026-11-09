import { ClickupReadonlyClient } from './clickup-readonly.client';
import { ClickupTaskComments } from './clickup-importer.type';
import { COMMENT_PAGE_SIZE, MAX_COMMENT_PAGES } from './import.constant';

export class ClickupCommentReader {
  constructor(private readonly client: ClickupReadonlyClient) {}

  async read(taskId: string): Promise<ClickupTaskComments> {
    const comments: any[] = [];
    let cursor = '';
    for (let guard = 0; guard < MAX_COMMENT_PAGES; guard++) {
      const res = await this.client.get<{ comments: any[] }>(`/task/${taskId}/comment${cursor}`);
      const fresh = res.comments.filter((c) => !comments.some((x) => x.id === c.id));
      comments.push(...fresh);
      if (res.comments.length < COMMENT_PAGE_SIZE || fresh.length === 0) break;
      const oldest = res.comments[res.comments.length - 1];
      cursor = `?start=${oldest.date}&start_id=${oldest.id}`;
    }
    const replies: any[] = [];
    for (const comment of comments) {
      if (!(Number(comment.reply_count) > 0)) continue;
      const res = await this.client.get<{ comments: any[] }>(`/comment/${comment.id}/reply`);
      replies.push(...res.comments);
    }
    return { comments, replies };
  }
}
