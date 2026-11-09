import { Inject, Injectable } from '@nestjs/common';
import { COMMENT_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { CommentRepository } from '@domain/repositories/comment.repository';
import { AuthPrincipal } from '@domain/types/auth-principal.type';
import { escapeRegex } from '@common/helpers/functions/regex.helper';
import { TaskFilterBuilder } from '@application/services/task-filter.builder';
import { ListTasksQuery } from '@application/commands/task/list-tasks.query';
import { GuestAccessService } from '@application/services/guest-access.service';

@Injectable()
export class TaskQueryFilterService {
  constructor(
    @Inject(COMMENT_INJECT_TOKEN) private readonly comments: CommentRepository,
    private readonly guests: GuestAccessService,
  ) {}

  async build(principal: AuthPrincipal, query: ListTasksQuery): Promise<Record<string, unknown> | null> {
    let commentTaskIds: string[] = [];
    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), 'i');
      const matches = await this.comments.findMany({ workspace_id: principal.workspaceId, body_md: regex }, { created_at: -1 }, 500);
      commentTaskIds = [...new Set(matches.map(c => c.getTaskId()))];
    }
    const filter = TaskFilterBuilder.build(principal.workspaceId, query, commentTaskIds);
    const allowed = await this.guests.allowedListIds(principal);
    if (allowed) {
      if (query.listId && !allowed.includes(query.listId)) return null;
      if (!query.listId) filter.list_id = { $in: allowed };
    }
    return filter;
  }
}
