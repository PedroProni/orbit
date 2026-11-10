import { AuditLogEntity } from '@domain/entities/audit-log.entity';
import { AuditMetaPolicy } from '@domain/policies/audit-meta.policy';
import { AuditReferenceKeyPolicy } from '@domain/policies/audit-reference-key.policy';
import { AuditReferences } from '@domain/types/audit-reference.type';
import { AuditLogView } from '@domain/types/audit-log-view.type';

export class AuditLogPresenter {
  static toView(log: AuditLogEntity, references: AuditReferences): AuditLogView {
    const actor = references.actors.get(AuditReferenceKeyPolicy.of(log.getActorType(), log.getActorId())) ?? { label: null, deleted: false };
    const entity = references.entities.get(AuditReferenceKeyPolicy.of(log.getEntityType(), log.getEntityId())) ?? { label: null, deleted: false };
    return {
      id: log.getId(),
      createdAt: log.getCreatedAt(),
      action: log.getAction(),
      actor: { type: log.getActorType(), id: log.getActorId(), name: actor.label, deleted: actor.deleted },
      entity: { type: log.getEntityType(), id: log.getEntityId(), label: entity.label, deleted: entity.deleted },
      meta: AuditMetaPolicy.redactTokenName(AuditMetaPolicy.sanitize(log.getMeta()), log.getEntityType(), entity.label !== null),
    };
  }
}
