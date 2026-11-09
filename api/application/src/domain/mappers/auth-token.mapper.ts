import { AuthTokenEntity } from '@domain/entities/auth-token.entity';

export class DomainAuthTokenMapper {
  static toPersistence(entity: AuthTokenEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      user_id: entity.getUserId(),
      kind: entity.getKind(),
      token_hash: entity.getTokenHash(),
      expires_at: entity.getExpiresAt(),
      used_at: entity.getUsedAt(),
      created_by: entity.getCreatedBy(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): AuthTokenEntity {
    return new AuthTokenEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      userId: raw.user_id,
      kind: raw.kind,
      tokenHash: raw.token_hash,
      expiresAt: raw.expires_at,
      usedAt: raw.used_at ?? null,
      createdBy: raw.created_by ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
