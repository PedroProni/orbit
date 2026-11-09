import { DashboardEntity } from '@domain/entities/dashboard.entity';

export class DomainDashboardMapper {
  static toPersistence(entity: DashboardEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      owner_id: entity.getOwnerId(),
      name: entity.getName(),
      shared: entity.getShared(),
      widgets: entity.getWidgets(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): DashboardEntity {
    return new DashboardEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      ownerId: raw.owner_id,
      name: raw.name,
      shared: raw.shared,
      widgets: raw.widgets ?? [],
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
