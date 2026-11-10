import { WebhookDeliveryEntity } from '@domain/entities/webhook-delivery.entity';
import { WebhookDeliveryOutcome } from '@domain/enums/webhook-delivery.enums';
import { BaseRepository } from '@domain/repositories/base.repository';

export interface WebhookDeliveryRepository extends BaseRepository<WebhookDeliveryEntity> {
  finish(deliveryId: string, outcome: WebhookDeliveryOutcome, linkedTasks: number, failureCode: string | null, finishedAt: Date): Promise<boolean>;
  countDuplicate(deliveryId: string, at: Date): Promise<void>;
}
