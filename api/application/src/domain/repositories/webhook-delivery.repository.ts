import { WebhookDeliveryEntity } from '@domain/entities/webhook-delivery.entity';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface WebhookDeliveryRepository extends BaseRepository<WebhookDeliveryEntity> {}
