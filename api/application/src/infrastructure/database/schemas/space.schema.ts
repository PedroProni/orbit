import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TaskStatusDefinition } from '@domain/types/task-status-definition.type';

export type SpaceDocument = HydratedDocument<Space>;

@Schema({ collection: 'spaces', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Space {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: [Object], default: [] })
  statuses!: TaskStatusDefinition[];

  @Prop({ type: [String], default: [] })
  required_tags!: string[];

  @Prop({ type: [String], default: [] })
  title_prefixes!: string[];

  @Prop({ type: Number })
  next_task_seq!: number;
}

export const SpaceSchema = SchemaFactory.createForClass(Space);
