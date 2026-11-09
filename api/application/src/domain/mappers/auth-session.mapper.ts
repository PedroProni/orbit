import { AuthSessionEntity } from '@domain/entities/auth-session.entity';

export class DomainAuthSessionMapper {
  static toPersistence(entity: AuthSessionEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      user_id: entity.getUserId(),
      ip: entity.getIp(),
      user_agent: entity.getUserAgent(),
      expires_at: entity.getExpiresAt(),
      revoked_at: entity.getRevokedAt(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): AuthSessionEntity {
    return new AuthSessionEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      userId: raw.user_id,
      ip: raw.ip ?? null,
      userAgent: raw.user_agent ?? null,
      expiresAt: raw.expires_at,
      revokedAt: raw.revoked_at ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
