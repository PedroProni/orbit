import { AuditActorType } from '@domain/enums/audit-log.enums';

export type AuditLogView = {
  id: string;
  createdAt: Date;
  action: string;
  actor: { type: AuditActorType; id: string; name: string | null; deleted: boolean };
  entity: { type: string; id: string; label: string | null; deleted: boolean };
  meta: Record<string, unknown>;
};
