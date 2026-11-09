import { TaskPriority } from '@/types/api.types';

export interface PriorityFlagProps {
  priority: TaskPriority | null;
  size?: number;
}
