import { StatusDefinition, Task } from '@/types/api.types';

export interface TaskRowProps {
  task: Task;
  people: Array<{ id: string; name: string }>;
  statuses: StatusDefinition[];
  readOnly?: boolean;
}
