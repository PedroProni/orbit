import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AutomationTriggerType } from '@domain/enums/automation.enums';
import { AutomationActionType } from '@domain/enums/automation.enums';

export type AutomationDocument = HydratedDocument<Automation>;

@Schema({ collection: 'automations', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Automation {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, default: null, index: true })
  list_id!: string | null;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: String, enum: Object.values(AutomationTriggerType) })
  trigger_type!: AutomationTriggerType;

  @Prop({ type: String, default: null })
  trigger_status!: string | null;

  @Prop({ type: String, enum: Object.values(AutomationActionType) })
  action_type!: AutomationActionType;

  @Prop({ type: String })
  action_value!: string;

  @Prop({ type: Boolean })
  active!: boolean;

  @Prop({ type: String })
  created_by!: string;
}

export const AutomationSchema = SchemaFactory.createForClass(Automation);
