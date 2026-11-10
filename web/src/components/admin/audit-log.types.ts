import { AuditLogItem } from '@/services/audit.types';

export interface AuditLogDraft {
  actorId: string;
  group: string;
  entityType: string;
  fromDay: string;
  toDay: string;
}

export interface AuditLogFiltersProps {
  draft: AuditLogDraft;
  invalidRange: boolean;
  onChange: (draft: AuditLogDraft) => void;
}

export interface AuditLogRowProps {
  item: AuditLogItem;
  onOpenTask: (taskId: string) => void;
}

export interface AuditActorLabel {
  key: string;
  values?: Record<string, string>;
  text?: string;
}

export interface AuditTransition {
  before: string;
  after: string;
}

export interface AuditMetaSummary {
  fields: string[];
  details: Array<[string, string]>;
  transition: AuditTransition | null;
}
