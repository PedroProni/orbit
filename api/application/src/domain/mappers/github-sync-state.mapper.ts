import { GithubSyncStateEntity } from '@domain/entities/github-sync-state.entity';

export class DomainGithubSyncStateMapper {
  static toPersistence(entity: GithubSyncStateEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      pull_cursor: entity.getPullCursor(),
      commit_cursor: entity.getCommitCursor(),
      locked_until: entity.getLockedUntil(),
      last_success_at: entity.getLastSuccessAt(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): GithubSyncStateEntity {
    return new GithubSyncStateEntity({
      _id: raw._id,
      pullCursor: raw.pull_cursor ?? null,
      commitCursor: raw.commit_cursor ?? null,
      lockedUntil: raw.locked_until ?? null,
      lastSuccessAt: raw.last_success_at ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
