import { WebhookDeliveryEntity } from '@domain/entities/webhook-delivery.entity';

export class DomainWebhookDeliveryMapper {
  static toPersistence(entity: WebhookDeliveryEntity): Record<string, unknown> {
    return {
      _id: entity.getId(),
      delivery_id: entity.getDeliveryId(),
      event: entity.getEvent(),
      created_at: entity.getCreatedAt(),
      updated_at: entity.getUpdatedAt(),
    };
  }

  static toDomain(raw: any): WebhookDeliveryEntity {
    return new WebhookDeliveryEntity({
      _id: raw._id,
      deliveryId: raw.delivery_id,
      event: raw.event,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    });
  }
}
