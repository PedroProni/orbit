import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LoginAttemptDocument = HydratedDocument<LoginAttempt>;

@Schema({ collection: 'login_attempts', versionKey: false })
export class LoginAttempt {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: Number, default: 0 })
  count!: number;

  @Prop({ type: Date, expires: 0 })
  expires_at!: Date;
}

export const LoginAttemptSchema = SchemaFactory.createForClass(LoginAttempt);
