import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type DocDocument = HydratedDocument<Doc>;

@Schema({ collection: 'docs', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Doc {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, default: null, index: true })
  space_id!: string | null;

  @Prop({ type: String, default: null, index: true })
  parent_id!: string | null;

  @Prop({ type: String })
  title!: string;

  @Prop({ type: String })
  body_md!: string;

  @Prop({ type: String })
  author_id!: string;

  @Prop({ type: Boolean })
  archived!: boolean;
}

export const DocSchema = SchemaFactory.createForClass(Doc);
