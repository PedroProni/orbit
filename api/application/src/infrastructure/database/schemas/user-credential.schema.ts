import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserCredentialDocument = HydratedDocument<UserCredential>;

@Schema({ collection: 'user_credentials', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class UserCredential {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String })
  password_hash!: string;

  @Prop({ type: Date })
  password_changed_at!: Date;
}

export const UserCredentialSchema = SchemaFactory.createForClass(UserCredential);
