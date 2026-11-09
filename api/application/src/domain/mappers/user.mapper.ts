import { UserEntity } from '@domain/entities/user.entity';

export class DomainUserMapper {
  static toPersistence(entity: UserEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      email: entity.getEmail(),
      name: entity.getName(),
      avatar_url: entity.getAvatarUrl(),
      clickup_id: entity.getClickupId(),
      role: entity.getRole(),
      status: entity.getStatus(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): UserEntity {
    return new UserEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      email: raw.email,
      name: raw.name,
      avatarUrl: raw.avatar_url ?? null,
      clickupId: raw.clickup_id ?? null,
      role: raw.role,
      status: raw.status,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
