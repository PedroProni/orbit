export type AuditActorType = 'user' | 'token' | 'system' | 'webhook';

export interface AuditActor {
  type: AuditActorType;
  id: string;
  name: string | null;
  deleted: boolean;
}

export interface AuditEntity {
  type: string;
  id: string;
  label: string | null;
  deleted: boolean;
}

export interface AuditLogItem {
  id: string;
  createdAt: string;
  action: string;
  actor: AuditActor;
  entity: AuditEntity;
  meta: Record<string, unknown>;
}

export interface AuditLogFilters {
  actorId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}
