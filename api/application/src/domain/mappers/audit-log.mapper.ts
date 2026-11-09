import { AuditLogEntity } from '@domain/entities/audit-log.entity';

export class DomainAuditLogMapper {
  static toPersistence(entity: AuditLogEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      workspace_id: entity.getWorkspaceId(),
      actor_type: entity.getActorType(),
      actor_id: entity.getActorId(),
      action: entity.getAction(),
      entity_type: entity.getEntityType(),
      entity_id: entity.getEntityId(),
      meta: entity.getMeta(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): AuditLogEntity {
    return new AuditLogEntity({
      _id: raw._id,
      workspaceId: raw.workspace_id,
      actorType: raw.actor_type,
      actorId: raw.actor_id,
      action: raw.action,
      entityType: raw.entity_type,
      entityId: raw.entity_id,
      meta: raw.meta,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
