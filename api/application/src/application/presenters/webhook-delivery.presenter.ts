import { WebhookDeliveryEntity } from '@domain/entities/webhook-delivery.entity';
import { WebhookDeliveryView } from '@domain/types/webhook-delivery-view.type';

export class WebhookDeliveryPresenter {
  static toView(delivery: WebhookDeliveryEntity): WebhookDeliveryView {
    return {
      id: delivery.getId(),
      deliveryId: delivery.getDeliveryId(),
      event: delivery.getEvent(),
      action: delivery.getAction(),
      repository: delivery.getRepository(),
      outcome: delivery.getOutcome(),
      failureCode: delivery.getFailureCode(),
      linkedTasks: delivery.getLinkedTasks(),
      duplicates: delivery.getDuplicates(),
      receivedAt: delivery.getCreatedAt(),
      finishedAt: delivery.getFinishedAt(),
    };
  }
}
