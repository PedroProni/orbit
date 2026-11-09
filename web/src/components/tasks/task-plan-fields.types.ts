import { Task } from '@/types/api.types';

export interface TaskPlanFieldProps {
  taskId: string;
  onError: (error: unknown) => void;
}

export interface TaskDependenciesProps extends TaskPlanFieldProps {
  siblings: Task[];
  open: boolean;
  onClose: () => void;
}

export interface TaskPlanPatch {
  estimateMinutes?: number | null;
  taskKind?: string;
}

export interface TaskRepeatIndicatorProps {
  taskId: string;
}
