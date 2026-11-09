import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ChatChannelKind } from '@domain/enums/chat.enums';

export type ChatChannelDocument = HydratedDocument<ChatChannel>;

@Schema({ collection: 'chat_channels', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ChatChannel {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: String, enum: Object.values(ChatChannelKind) })
  kind!: ChatChannelKind;

  @Prop({ type: [String], default: [] })
  member_ids!: string[];

  @Prop({ type: String })
  created_by!: string;
}

export const ChatChannelSchema = SchemaFactory.createForClass(ChatChannel);
