import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '@domain/enums/user.enums';
import { UserStatus } from '@domain/enums/user.enums';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, unique: true })
  email!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: String, default: null })
  avatar_url!: string | null;

  @Prop({ type: String, default: null, index: true })
  clickup_id!: string | null;

  @Prop({ type: String, enum: Object.values(UserRole) })
  role!: UserRole;

  @Prop({ type: String, enum: Object.values(UserStatus) })
  status!: UserStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);
