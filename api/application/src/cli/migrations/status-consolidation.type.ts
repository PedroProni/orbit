import { TaskStatusDefinition } from '@domain/types/task-status-definition.type';

export interface ConsolidationSpaceDoc {
  _id: string;
  workspace_id: string;
  statuses: TaskStatusDefinition[];
}

export interface ConsolidationTaskDoc {
  _id: string;
  workspace_id: string;
  space_id: string;
  status: string;
  tags: string[];
  date_closed: Date | null;
  updated_at: Date;
}

export interface TaskStateSnapshot {
  status: string;
  tags: string[];
  dateClosed: Date | null;
}

export interface PlannedTaskChange {
  id: string;
  workspaceId: string;
  before: TaskStateSnapshot;
  after: TaskStateSnapshot;
}

export interface PlannedSpaceChange {
  id: string;
  workspaceId: string;
  before: string[];
  after: TaskStatusDefinition[];
}

export interface StatusConsolidationPlan {
  spaces: PlannedSpaceChange[];
  tasks: PlannedTaskChange[];
  unmapped: Array<{ taskId: string; status: string }>;
  transitions: Record<string, number>;
  countsBefore: Record<string, number>;
  countsAfter: Record<string, number>;
  cancelledTagged: number;
  dateClosedChanged: number;
}
