import { DocEntity } from '@domain/entities/doc.entity';

export class DomainDocMapper {
  static toPersistence(entity: DocEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      space_id: entity.getSpaceId(),
      parent_id: entity.getParentId(),
      title: entity.getTitle(),
      body_md: entity.getBodyMd(),
      author_id: entity.getAuthorId(),
      archived: entity.getArchived(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): DocEntity {
    return new DocEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      spaceId: raw.space_id ?? null,
      parentId: raw.parent_id ?? null,
      title: raw.title,
      bodyMd: raw.body_md,
      authorId: raw.author_id,
      archived: raw.archived,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
