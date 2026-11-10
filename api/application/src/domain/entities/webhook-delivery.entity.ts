import { WebhookDeliveryOutcome } from '@domain/enums/webhook-delivery.enums';
import { WebhookDeliveryEntityProps } from '@domain/props/webhook-delivery-entity.props';

export class WebhookDeliveryEntity {
  private readonly _id: string;
  private deliveryId: string;
  private event: string;
  private action: string | null;
  private repository: string | null;
  private outcome: WebhookDeliveryOutcome | null;
  private linkedTasks: number;
  private duplicates: number;
  private failureCode: string | null;
  private finishedAt: Date | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: WebhookDeliveryEntityProps) {
    this._id = props._id;
    this.deliveryId = props.deliveryId;
    this.event = props.event;
    this.action = props.action;
    this.repository = props.repository;
    this.outcome = props.outcome;
    this.linkedTasks = props.linkedTasks;
    this.duplicates = props.duplicates;
    this.failureCode = props.failureCode;
    this.finishedAt = props.finishedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  getId(): string {
    return this._id;
  }

  getDeliveryId(): string {
    return this.deliveryId;
  }

  getEvent(): string {
    return this.event;
  }

  getAction(): string | null {
    return this.action;
  }

  getRepository(): string | null {
    return this.repository;
  }

  getOutcome(): WebhookDeliveryOutcome | null {
    return this.outcome;
  }

  getLinkedTasks(): number {
    return this.linkedTasks;
  }

  getDuplicates(): number {
    return this.duplicates;
  }

  getFailureCode(): string | null {
    return this.failureCode;
  }

  getFinishedAt(): Date | null {
    return this.finishedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  toProps(): WebhookDeliveryEntityProps {
    return {
      _id: this._id,
      deliveryId: this.deliveryId,
      event: this.event,
      action: this.action,
      repository: this.repository,
      outcome: this.outcome,
      linkedTasks: this.linkedTasks,
      duplicates: this.duplicates,
      failureCode: this.failureCode,
      finishedAt: this.finishedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
