import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AutomationRunStatus } from '@domain/enums/automation-run.enums';
import { AUTOMATION_RUN_TTL_SECONDS } from '@domain/constants/automation.constant';

export type AutomationRunDocument = HydratedDocument<AutomationRun>;

@Schema({ collection: 'automation_runs', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class AutomationRun {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String })
  automation_id!: string;

  @Prop({ type: String })
  trigger_key!: string;

  @Prop({ type: String })
  task_id!: string;

  @Prop({ type: String, enum: Object.values(AutomationRunStatus) })
  status!: AutomationRunStatus;

  @Prop({ type: String, default: null })
  reason!: string | null;
}

export const AutomationRunSchema = SchemaFactory.createForClass(AutomationRun);
AutomationRunSchema.index({ automation_id: 1, trigger_key: 1 }, { unique: true });
AutomationRunSchema.index({ automation_id: 1, created_at: -1 });
AutomationRunSchema.index({ created_at: 1 }, { expireAfterSeconds: AUTOMATION_RUN_TTL_SECONDS });
