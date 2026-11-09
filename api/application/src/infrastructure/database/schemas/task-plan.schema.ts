import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { TaskKind } from '@domain/enums/task-kind.enums';

export type TaskPlanDocument = HydratedDocument<TaskPlan>;

@Schema({ collection: 'task_plans', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class TaskPlan {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, unique: true })
  task_id!: string;

  @Prop({ type: Number, default: null })
  estimate_minutes!: number | null;

  @Prop({ type: String, enum: Object.values(TaskKind) })
  task_kind!: TaskKind;
}

export const TaskPlanSchema = SchemaFactory.createForClass(TaskPlan);
