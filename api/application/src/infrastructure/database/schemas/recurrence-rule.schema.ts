import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RecurrenceFrequency } from '@domain/enums/recurrence.enums';

export type RecurrenceRuleDocument = HydratedDocument<RecurrenceRule>;

@Schema({ collection: 'recurrence_rules', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class RecurrenceRule {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, unique: true })
  task_id!: string;

  @Prop({ type: String, enum: Object.values(RecurrenceFrequency) })
  frequency!: RecurrenceFrequency;

  @Prop({ type: Number })
  interval!: number;

  @Prop({ type: Date, index: true })
  next_run_at!: Date;

  @Prop({ type: Boolean })
  active!: boolean;

  @Prop({ type: String, default: null })
  last_created_task_id!: string | null;

  @Prop({ type: String })
  created_by!: string;
}

export const RecurrenceRuleSchema = SchemaFactory.createForClass(RecurrenceRule);
