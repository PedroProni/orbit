import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type TaskDependencyDocument = HydratedDocument<TaskDependency>;

@Schema({ collection: 'task_dependencies', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class TaskDependency {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  task_id!: string;

  @Prop({ type: String, index: true })
  depends_on_id!: string;
}

export const TaskDependencySchema = SchemaFactory.createForClass(TaskDependency);
TaskDependencySchema.index({"task_id":1,"depends_on_id":1}, {"unique":true});
