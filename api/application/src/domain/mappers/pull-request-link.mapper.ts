import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';
import { PullRequestLinkSource } from '@domain/enums/pull-request-link.enums';

export class DomainPullRequestLinkMapper {
  static toPersistence(entity: PullRequestLinkEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      task_id: entity.getTaskId(),
      repository: entity.getRepository(),
      number: entity.getNumber(),
      url: entity.getUrl(),
      title: entity.getTitle(),
      state: entity.getState(),
      source: entity.getSource(),
      created_by: entity.getCreatedBy(),
      author_login: entity.getAuthorLogin(),
      author_avatar_url: entity.getAuthorAvatarUrl(),
      head_ref: entity.getHeadRef(),
      head_sha: entity.getHeadSha(),
      draft: entity.isDraft(),
      checks_state: entity.getChecksState(),
      github_updated_at: entity.getGithubUpdatedAt(),
      synced_at: entity.getSyncedAt(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): PullRequestLinkEntity {
    return new PullRequestLinkEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      taskId: raw.task_id,
      repository: raw.repository,
      number: raw.number,
      url: raw.url,
      title: raw.title,
      state: raw.state ?? null,
      source: raw.source ?? PullRequestLinkSource.WEBHOOK,
      createdBy: raw.created_by ?? null,
      authorLogin: raw.author_login ?? null,
      authorAvatarUrl: raw.author_avatar_url ?? null,
      headRef: raw.head_ref ?? null,
      headSha: raw.head_sha ?? null,
      draft: raw.draft === true,
      checksState: raw.checks_state ?? null,
      githubUpdatedAt: raw.github_updated_at ?? null,
      syncedAt: raw.synced_at ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
