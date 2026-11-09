import { PullRequestLinkEntity } from '@domain/entities/pull-request-link.entity';

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
      state: raw.state,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
