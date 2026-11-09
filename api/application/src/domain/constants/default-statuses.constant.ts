import { StatusType } from '@domain/enums/space.enums';
import { TaskStatusDefinition } from '@domain/types/task-status-definition.type';

export const DEFAULT_STATUSES: TaskStatusDefinition[] = [
  { name: 'backlog', color: '#8b8fa3', type: StatusType.OPEN, order: 0 },
  { name: 'to-do', color: '#60a5fa', type: StatusType.OPEN, order: 1 },
  { name: 'stuck', color: '#ef4444', type: StatusType.ACTIVE, order: 2 },
  { name: 'in development', color: '#f5a524', type: StatusType.ACTIVE, order: 3 },
  { name: 'waiting review', color: '#c084fc', type: StatusType.REVIEW, order: 4 },
  { name: 'in review', color: '#a855f7', type: StatusType.REVIEW, order: 5 },
  { name: 'completed', color: '#22c55e', type: StatusType.DONE, order: 6 },
];

export const DEFAULT_STATUSES_LOCKED_ERROR = 'Default statuses cannot be removed, renamed or reordered';
