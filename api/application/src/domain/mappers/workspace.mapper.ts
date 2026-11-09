import { WorkspaceEntity } from '@domain/entities/workspace.entity';

export class DomainWorkspaceMapper {
  static toPersistence(entity: WorkspaceEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      name: entity.getName(),
      slug: entity.getSlug(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): WorkspaceEntity {
    return new WorkspaceEntity({
      _id: raw._id,
      name: raw.name,
      slug: raw.slug,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
