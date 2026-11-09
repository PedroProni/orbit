import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type AttachmentDocument = HydratedDocument<Attachment>;

@Schema({ collection: 'attachments', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Attachment {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  task_id!: string;

  @Prop({ type: String, default: null })
  comment_id!: string | null;

  @Prop({ type: String })
  storage_key!: string;

  @Prop({ type: String })
  filename!: string;

  @Prop({ type: String })
  mime_type!: string;

  @Prop({ type: Number })
  size_bytes!: number;

  @Prop({ type: String })
  uploader_id!: string;

  @Prop({ type: Boolean })
  confirmed!: boolean;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);
