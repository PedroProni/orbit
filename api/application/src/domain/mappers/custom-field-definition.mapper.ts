import { CustomFieldDefinitionEntity } from '@domain/entities/custom-field-definition.entity';

export class DomainCustomFieldDefinitionMapper {
  static toPersistence(entity: CustomFieldDefinitionEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      space_id: entity.getSpaceId(),
      name: entity.getName(),
      type: entity.getType(),
      options: entity.getOptions(),
      list_ids: entity.getListIds(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): CustomFieldDefinitionEntity {
    return new CustomFieldDefinitionEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      spaceId: raw.space_id,
      name: raw.name,
      type: raw.type,
      options: raw.options ?? [],
      listIds: raw.list_ids ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
