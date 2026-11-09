import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { GoalTarget } from '@domain/types/goal-target.type';

export type GoalDocument = HydratedDocument<Goal>;

@Schema({ collection: 'goals', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Goal {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: String })
  description!: string;

  @Prop({ type: String, index: true })
  owner_id!: string;

  @Prop({ type: Date, default: null })
  due_date!: Date | null;

  @Prop({ type: [Object], default: [] })
  targets!: GoalTarget[];
}

export const GoalSchema = SchemaFactory.createForClass(Goal);
