import { Task } from '@/types/api.types';

export interface TaskIndicatorsProps {
  task: Task;
  subtasks: number;
  checklist?: boolean;
}
