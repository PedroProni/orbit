import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuthSessionDocument = HydratedDocument<AuthSession>;

@Schema({ collection: 'auth_sessions', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class AuthSession {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  user_id!: string;

  @Prop({ type: String, default: null })
  ip!: string | null;

  @Prop({ type: String, default: null })
  user_agent!: string | null;

  @Prop({ type: Date, expires: 0 })
  expires_at!: Date;

  @Prop({ type: Date, default: null })
  revoked_at!: Date | null;
}

export const AuthSessionSchema = SchemaFactory.createForClass(AuthSession);
