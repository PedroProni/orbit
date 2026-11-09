import { FolderEntity } from '@domain/entities/folder.entity';

export class DomainFolderMapper {
  static toPersistence(entity: FolderEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      space_id: entity.getSpaceId(),
      name: entity.getName(),
      order: entity.getOrder(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): FolderEntity {
    return new FolderEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      spaceId: raw.space_id,
      name: raw.name,
      order: raw.order,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
