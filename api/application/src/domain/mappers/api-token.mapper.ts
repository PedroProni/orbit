import { ApiTokenEntity } from '@domain/entities/api-token.entity';

export class DomainApiTokenMapper {
  static toPersistence(entity: ApiTokenEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      user_id: entity.getUserId(),
      name: entity.getName(),
      token_hash: entity.getTokenHash(),
      scopes: entity.getScopes(),
      last_used_at: entity.getLastUsedAt(),
      revoked_at: entity.getRevokedAt(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): ApiTokenEntity {
    return new ApiTokenEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      userId: raw.user_id,
      name: raw.name,
      tokenHash: raw.token_hash,
      scopes: raw.scopes ?? [],
      lastUsedAt: raw.last_used_at ?? null,
      revokedAt: raw.revoked_at ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
