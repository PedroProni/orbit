import { GithubRefEntity } from '@domain/entities/github-ref.entity';

export class DomainGithubRefMapper {
  static toPersistence(entity: GithubRefEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      task_id: entity.getTaskId(),
      repository: entity.getRepository(),
      kind: entity.getKind(),
      key: entity.getKey(),
      title: entity.getTitle(),
      url: entity.getUrl(),
      author_login: entity.getAuthorLogin(),
      occurred_at: entity.getOccurredAt(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): GithubRefEntity {
    return new GithubRefEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      taskId: raw.task_id,
      repository: raw.repository,
      kind: raw.kind,
      key: raw.key,
      title: raw.title ?? '',
      url: raw.url ?? '',
      authorLogin: raw.author_login ?? null,
      occurredAt: raw.occurred_at ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
