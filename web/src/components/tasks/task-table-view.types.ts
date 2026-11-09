import { StatusDefinition, Task } from '@/types/api.types';

export interface TaskTableViewProps {
  tasks: Task[];
  statusesOf: (task: Task) => StatusDefinition[];
  readOnly: boolean;
}

export interface TableAssigneeCellProps {
  people: Array<{ id: string; name: string }>;
}

export interface TablePriorityCellProps {
  task: Task;
  readOnly: boolean;
  onChange: (priority: Task['priority']) => void;
}
