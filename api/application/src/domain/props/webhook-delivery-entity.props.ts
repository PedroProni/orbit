import { WebhookDeliveryOutcome } from '@domain/enums/webhook-delivery.enums';

export interface WebhookDeliveryEntityProps {
  _id: string;
  deliveryId: string;
  event: string;
  action: string | null;
  repository: string | null;
  outcome: WebhookDeliveryOutcome | null;
  linkedTasks: number;
  duplicates: number;
  failureCode: string | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
