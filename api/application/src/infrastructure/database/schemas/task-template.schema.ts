import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TaskPriority } from '@domain/enums/task.enums';
import { TaskKind } from '@domain/enums/task-kind.enums';

export type TaskTemplateDocument = HydratedDocument<TaskTemplate>;

@Schema({ collection: 'task_templates', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class TaskTemplate {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  space_id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: String })
  title_template!: string;

  @Prop({ type: String })
  description_md!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: String, enum: Object.values(TaskPriority), default: null })
  priority!: TaskPriority | null;

  @Prop({ type: String, enum: Object.values(TaskKind) })
  task_kind!: TaskKind;

  @Prop({ type: Number, default: null })
  estimate_minutes!: number | null;
}

export const TaskTemplateSchema = SchemaFactory.createForClass(TaskTemplate);
