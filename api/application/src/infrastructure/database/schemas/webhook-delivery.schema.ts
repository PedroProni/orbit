import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type WebhookDeliveryDocument = HydratedDocument<WebhookDelivery>;

@Schema({ collection: 'webhook_deliveries', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class WebhookDelivery {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, unique: true })
  delivery_id!: string;

  @Prop({ type: String })
  event!: string;
}

export const WebhookDeliverySchema = SchemaFactory.createForClass(WebhookDelivery);
