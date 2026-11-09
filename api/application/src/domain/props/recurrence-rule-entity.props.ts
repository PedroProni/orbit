import { RecurrenceFrequency } from '@domain/enums/recurrence.enums';

export interface RecurrenceRuleEntityProps {
  _id: string;
  workspaceId: string;
  taskId: string;
  frequency: RecurrenceFrequency;
  interval: number;
  nextRunAt: Date;
  active: boolean;
  lastCreatedTaskId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
