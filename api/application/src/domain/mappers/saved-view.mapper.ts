import { SavedViewEntity } from '@domain/entities/saved-view.entity';

export class DomainSavedViewMapper {
  static toPersistence(entity: SavedViewEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      owner_id: entity.getOwnerId(),
      name: entity.getName(),
      view_type: entity.getViewType(),
      list_id: entity.getListId(),
      filters: entity.getFilters(),
      display: entity.getDisplay(),
      shared: entity.getShared(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): SavedViewEntity {
    return new SavedViewEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      ownerId: raw.owner_id,
      name: raw.name,
      viewType: raw.view_type,
      listId: raw.list_id ?? null,
      filters: raw.filters,
      display: raw.display ?? null,
      shared: raw.shared,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
