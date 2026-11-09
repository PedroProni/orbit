import { UserGroupEntity } from '@domain/entities/user-group.entity';

export class DomainUserGroupMapper {
  static toPersistence(entity: UserGroupEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      name: entity.getName(),
      member_ids: entity.getMemberIds(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): UserGroupEntity {
    return new UserGroupEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      name: raw.name,
      memberIds: raw.member_ids ?? [],
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
