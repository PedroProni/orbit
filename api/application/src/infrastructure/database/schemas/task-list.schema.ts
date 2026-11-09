import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SprintKind } from '@domain/enums/list.enums';

export type TaskListDocument = HydratedDocument<TaskList>;

@Schema({ collection: 'task_lists', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class TaskList {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  space_id!: string;

  @Prop({ type: String, default: null, index: true })
  folder_id!: string | null;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: String, enum: Object.values(SprintKind) })
  kind!: SprintKind;

  @Prop({ type: Date, default: null })
  start_date!: Date | null;

  @Prop({ type: Date, default: null })
  end_date!: Date | null;

  @Prop({ type: Number })
  order!: number;

  @Prop({ type: String, default: null })
  clickup_id!: string | null;
}

export const TaskListSchema = SchemaFactory.createForClass(TaskList);
