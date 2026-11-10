import { AutomationRunStatus } from '@domain/enums/automation-run.enums';

export interface AutomationRunEntityProps {
  _id: string;
  workspaceId: string;
  automationId: string;
  triggerKey: string;
  taskId: string;
  status: AutomationRunStatus;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
