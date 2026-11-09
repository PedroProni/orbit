import { UserCredentialEntity } from '@domain/entities/user-credential.entity';

export class DomainUserCredentialMapper {
  static toPersistence(entity: UserCredentialEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      password_hash: entity.getPasswordHash(),
      password_changed_at: entity.getPasswordChangedAt(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): UserCredentialEntity {
    return new UserCredentialEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      passwordHash: raw.password_hash,
      passwordChangedAt: raw.password_changed_at,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
