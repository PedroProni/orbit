import { AuditActorType } from '@domain/enums/audit-log.enums';

export interface AuditLogEntityProps {
  _id: string;
  workspaceId: string;
  actorType: AuditActorType;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  meta: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
