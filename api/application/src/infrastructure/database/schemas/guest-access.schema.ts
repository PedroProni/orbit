import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type GuestAccessDocument = HydratedDocument<GuestAccess>;

@Schema({ collection: 'guest_accesses', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class GuestAccess {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, unique: true })
  user_id!: string;

  @Prop({ type: [String], default: [] })
  list_ids!: string[];
}

export const GuestAccessSchema = SchemaFactory.createForClass(GuestAccess);
