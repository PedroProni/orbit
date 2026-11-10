import { WebhookDeliveryOutcome } from '@domain/enums/webhook-delivery.enums';

export type WebhookDeliveryView = {
  id: string;
  deliveryId: string;
  event: string;
  action: string | null;
  repository: string | null;
  outcome: WebhookDeliveryOutcome | null;
  failureCode: string | null;
  linkedTasks: number;
  duplicates: number;
  receivedAt: Date;
  finishedAt: Date | null;
};
