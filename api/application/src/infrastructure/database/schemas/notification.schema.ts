import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { NotificationType } from '@domain/enums/notification.enums';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ collection: 'notifications', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Notification {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  user_id!: string;

  @Prop({ type: String, enum: Object.values(NotificationType) })
  type!: NotificationType;

  @Prop({ type: String })
  task_id!: string;

  @Prop({ type: String, default: null })
  comment_id!: string | null;

  @Prop({ type: String })
  actor_id!: string;

  @Prop({ type: Date, default: null })
  read_at!: Date | null;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
