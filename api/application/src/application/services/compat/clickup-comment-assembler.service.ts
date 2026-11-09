import { Inject, Injectable } from '@nestjs/common';
import { USER_INJECT_TOKEN } from '@domain/constants/inject-token.constant';
import { UserRepository } from '@domain/repositories/user.repository';
import { CommentEntity } from '@domain/entities/comment.entity';
import { ClickupUserResolver } from '@application/services/compat/clickup-user-resolver.service';

@Injectable()
export class ClickupCommentAssembler {
  constructor(
    @Inject(USER_INJECT_TOKEN) private readonly users: UserRepository,
    private readonly resolver: ClickupUserResolver,
  ) {}

  async assemble(workspaceId: string, comments: CommentEntity[]) {
    const authors = new Map((await this.users.findMany({ workspace_id: workspaceId, _id: { $in: [...new Set(comments.map((c) => c.getAuthorId()))] } })).map((u) => [u.getId(), u]));
    return comments.map((c) => ({
      id: c.getId(),
      comment: [{ text: c.getBodyMd() }],
      comment_text: c.getBodyMd(),
      user: authors.has(c.getAuthorId()) ? this.resolver.toView(authors.get(c.getAuthorId())!) : null,
      resolved: false,
      assignee: null,
      assigned_by: null,
      reactions: [],
      date: String(c.getCreatedAt().getTime()),
    }));
  }
}
