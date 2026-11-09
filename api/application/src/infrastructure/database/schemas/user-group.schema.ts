import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type UserGroupDocument = HydratedDocument<UserGroup>;

@Schema({ collection: 'user_groups', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class UserGroup {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: [String], default: [] })
  member_ids!: string[];
}

export const UserGroupSchema = SchemaFactory.createForClass(UserGroup);
