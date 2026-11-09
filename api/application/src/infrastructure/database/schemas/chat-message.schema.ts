import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type ChatMessageDocument = HydratedDocument<ChatMessage>;

@Schema({ collection: 'chat_messages', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ChatMessage {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  channel_id!: string;

  @Prop({ type: String })
  author_id!: string;

  @Prop({ type: String })
  body_md!: string;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
