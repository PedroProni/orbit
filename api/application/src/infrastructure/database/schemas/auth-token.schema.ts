import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AuthTokenKind } from '@domain/enums/auth-token.enums';

export type AuthTokenDocument = HydratedDocument<AuthToken>;

@Schema({ collection: 'auth_tokens', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class AuthToken {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  user_id!: string;

  @Prop({ type: String, enum: Object.values(AuthTokenKind) })
  kind!: AuthTokenKind;

  @Prop({ type: String, unique: true })
  token_hash!: string;

  @Prop({ type: Date, expires: 0 })
  expires_at!: Date;

  @Prop({ type: Date, default: null })
  used_at!: Date | null;

  @Prop({ type: String, default: null })
  created_by!: string | null;
}

export const AuthTokenSchema = SchemaFactory.createForClass(AuthToken);
