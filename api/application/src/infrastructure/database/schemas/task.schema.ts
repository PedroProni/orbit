import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TaskPriority } from '@domain/enums/task.enums';
import { TaskCustomFieldValue } from '@domain/types/task-custom-field-value.type';
import { Checklist } from '@domain/types/checklist.type';

export type TaskDocument = HydratedDocument<Task>;

@Schema({ collection: 'tasks', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Task {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  space_id!: string;

  @Prop({ type: String, index: true })
  list_id!: string;

  @Prop({ type: String, default: null, index: true })
  parent_id!: string | null;

  @Prop({ type: String })
  title!: string;

  @Prop({ type: String })
  description_md!: string;

  @Prop({ type: String, index: true })
  status!: string;

  @Prop({ type: String, enum: Object.values(TaskPriority), default: null })
  priority!: TaskPriority | null;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [String], default: [] })
  assignee_ids!: string[];

  @Prop({ type: [String], default: [] })
  watcher_ids!: string[];

  @Prop({ type: Number, default: null })
  points!: number | null;

  @Prop({ type: Date, default: null })
  start_date!: Date | null;

  @Prop({ type: Date, default: null })
  due_date!: Date | null;

  @Prop({ type: [Object], default: [] })
  custom_fields!: TaskCustomFieldValue[];

  @Prop({ type: [Object], default: [] })
  checklists!: Checklist[];

  @Prop({ type: String })
  creator_id!: string;

  @Prop({ type: Date, default: null })
  date_closed!: Date | null;

  @Prop({ type: Boolean })
  archived!: boolean;

  @Prop({ type: String, default: null })
  clickup_id!: string | null;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.index({"workspace_id":1,"updated_at":-1});
TaskSchema.index({"title":"text","description_md":"text"});
