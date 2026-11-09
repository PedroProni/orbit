import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type FolderDocument = HydratedDocument<Folder>;

@Schema({ collection: 'folders', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Folder {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  space_id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: Number })
  order!: number;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);
