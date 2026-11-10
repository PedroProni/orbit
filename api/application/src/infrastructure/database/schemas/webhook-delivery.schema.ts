import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { WebhookDeliveryOutcome } from '@domain/enums/webhook-delivery.enums';

export type WebhookDeliveryDocument = HydratedDocument<WebhookDelivery>;

@Schema({ collection: 'webhook_deliveries', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class WebhookDelivery {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, unique: true })
  delivery_id!: string;

  @Prop({ type: String })
  event!: string;

  @Prop({ type: String, default: null })
  action!: string | null;

  @Prop({ type: String, default: null })
  repository!: string | null;

  @Prop({ type: String, enum: [...Object.values(WebhookDeliveryOutcome), null], default: null })
  outcome!: WebhookDeliveryOutcome | null;

  @Prop({ type: Number, default: 0 })
  linked_tasks!: number;

  @Prop({ type: Number, default: 0 })
  duplicates!: number;

  @Prop({ type: String, default: null })
  failure_code!: string | null;

  @Prop({ type: Date, default: null })
  finished_at!: Date | null;
}

export const WebhookDeliverySchema = SchemaFactory.createForClass(WebhookDelivery);
WebhookDeliverySchema.index({ created_at: -1, _id: -1 });
