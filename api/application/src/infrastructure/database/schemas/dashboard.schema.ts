import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DashboardWidget } from '@domain/types/dashboard-widget.type';

export type DashboardDocument = HydratedDocument<Dashboard>;

@Schema({ collection: 'dashboards', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Dashboard {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, index: true })
  owner_id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: Boolean })
  shared!: boolean;

  @Prop({ type: [Object], default: [] })
  widgets!: DashboardWidget[];
}

export const DashboardSchema = SchemaFactory.createForClass(Dashboard);
