import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type CommentDocument = HydratedDocument<Comment>;

@Schema({ collection: 'comments', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Comment {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  task_id!: string;

  @Prop({ type: String })
  author_id!: string;

  @Prop({ type: String })
  body_md!: string;

  @Prop({ type: [String], default: [] })
  mention_ids!: string[];

  @Prop({ type: [String], default: [] })
  attachment_ids!: string[];

  @Prop({ type: String, default: null })
  daily_log_date!: string | null;

  @Prop({ type: Date, default: null })
  edited_at!: Date | null;

  @Prop({ type: String, default: null })
  clickup_id!: string | null;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.index({"body_md":"text"});
