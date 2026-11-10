import { WebhookDeliveryEntity } from '@domain/entities/webhook-delivery.entity';

export class DomainWebhookDeliveryMapper {
  static toPersistence(entity: WebhookDeliveryEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      delivery_id: entity.getDeliveryId(),
      event: entity.getEvent(),
      action: entity.getAction(),
      repository: entity.getRepository(),
      outcome: entity.getOutcome(),
      linked_tasks: entity.getLinkedTasks(),
      duplicates: entity.getDuplicates(),
      failure_code: entity.getFailureCode(),
      finished_at: entity.getFinishedAt(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): WebhookDeliveryEntity {
    return new WebhookDeliveryEntity({
      _id: raw._id,
      deliveryId: raw.delivery_id,
      event: raw.event,
      action: raw.action ?? null,
      repository: raw.repository ?? null,
      outcome: raw.outcome ?? null,
      linkedTasks: raw.linked_tasks ?? 0,
      duplicates: raw.duplicates ?? 0,
      failureCode: raw.failure_code ?? null,
      finishedAt: raw.finished_at ?? null,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
