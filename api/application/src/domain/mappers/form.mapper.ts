import { FormEntity } from '@domain/entities/form.entity';

export class DomainFormMapper {
  static toPersistence(entity: FormEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      list_id: entity.getListId(),
      name: entity.getName(),
      public_key: entity.getPublicKey(),
      fields: entity.getFields(),
      active: entity.getActive(),
      created_by: entity.getCreatedBy(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): FormEntity {
    return new FormEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      listId: raw.list_id,
      name: raw.name,
      publicKey: raw.public_key,
      fields: raw.fields ?? [],
      active: raw.active,
      createdBy: raw.created_by,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
