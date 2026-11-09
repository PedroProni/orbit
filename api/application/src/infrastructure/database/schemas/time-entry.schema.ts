import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';


export type TimeEntryDocument = HydratedDocument<TimeEntry>;

@Schema({ collection: 'time_entries', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class TimeEntry {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  task_id!: string;

  @Prop({ type: String, index: true })
  user_id!: string;

  @Prop({ type: Date })
  started_at!: Date;

  @Prop({ type: Date, default: null })
  ended_at!: Date | null;

  @Prop({ type: Number })
  minutes!: number;
}

export const TimeEntrySchema = SchemaFactory.createForClass(TimeEntry);
