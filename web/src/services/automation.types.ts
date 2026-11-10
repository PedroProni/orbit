export type AutomationTriggerType = 'task_created' | 'status_changed' | 'priority_changed' | 'assignee_added' | 'date_reached';

export type AutomationActionType = 'assign' | 'add_tag' | 'set_priority' | 'set_status' | 'comment' | 'notify' | 'webhook';

export type AutomationRunStatus = 'done' | 'skipped' | 'failed';

export interface AutomationLastRun {
  status: AutomationRunStatus;
  reason: string | null;
  at: string;
}

export interface Automation {
  id: string;
  listId: string | null;
  name: string;
  triggerType: AutomationTriggerType;
  triggerValue: string | null;
  actionType: AutomationActionType;
  actionValue: string;
  actionUserIds: string[];
  active: boolean;
  hasSecret: boolean;
  createdAt: string;
  updatedAt: string;
  lastRun: AutomationLastRun | null;
}

export interface AutomationInput {
  name: string;
  listId: string | null;
  triggerType: AutomationTriggerType;
  triggerValue: string | null;
  actionType: AutomationActionType;
  actionValue: string;
  actionUserIds: string[];
  active?: boolean;
  rotateSecret?: boolean;
}

export interface AutomationSaved extends Automation {
  webhookSecret?: string;
}

export interface AutomationUpdate {
  id: string;
  input: Partial<AutomationInput>;
}

export interface AutomationRun {
  id: string;
  taskId: string;
  taskTitle: string | null;
  status: AutomationRunStatus;
  reason: string | null;
  createdAt: string;
}
