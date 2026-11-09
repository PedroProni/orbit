import { WebhookDeliveryEntityProps } from '@domain/props/webhook-delivery-entity.props';

export class WebhookDeliveryEntity {
  private readonly _id: string;
  private deliveryId: string;
  private event: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(props: WebhookDeliveryEntityProps) {
    this._id = props._id;
    this.deliveryId = props.deliveryId;
    this.event = props.event;
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

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  toProps(): WebhookDeliveryEntityProps {
    return { _id: this._id, deliveryId: this.deliveryId, event: this.event, createdAt: this.createdAt, updatedAt: this.updatedAt };
  }
}
