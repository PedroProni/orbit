import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AuditActorType } from '@domain/enums/audit-log.enums';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ collection: 'audit_logs', versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class AuditLog {
  @Prop({ type: String })
  _id!: string;

  @Prop({ type: String, index: true })
  workspace_id!: string;

  @Prop({ type: String, enum: Object.values(AuditActorType) })
  actor_type!: AuditActorType;

  @Prop({ type: String })
  actor_id!: string;

  @Prop({ type: String })
  action!: string;

  @Prop({ type: String })
  entity_type!: string;

  @Prop({ type: String })
  entity_id!: string;

  @Prop({ type: Object })
  meta!: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
