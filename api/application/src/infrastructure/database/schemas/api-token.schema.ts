import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type ApiTokenDocument = HydratedDocument<ApiToken>;

@Schema({ collection: 'api_tokens', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class ApiToken {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String })
  user_id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: String, unique: true })
  token_hash!: string;

  @Prop({ type: [String], default: [] })
  scopes!: string[];

  @Prop({ type: Date, default: null })
  last_used_at!: Date | null;

  @Prop({ type: Date, default: null })
  revoked_at!: Date | null;
}

export const ApiTokenSchema = SchemaFactory.createForClass(ApiToken);
