import { GuestAccessEntity } from '@domain/entities/guest-access.entity';

export class DomainGuestAccessMapper {
  static toPersistence(entity: GuestAccessEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      user_id: entity.getUserId(),
      list_ids: entity.getListIds(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): GuestAccessEntity {
    return new GuestAccessEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      userId: raw.user_id,
      listIds: raw.list_ids ?? [],
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
