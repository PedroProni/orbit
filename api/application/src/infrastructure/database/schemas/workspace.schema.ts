import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type WorkspaceDocument = HydratedDocument<Workspace>;

@Schema({ collection: 'workspaces', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Workspace {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: String, unique: true })
  slug!: string;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
