import { TaskKind } from '@domain/enums/task-kind.enums';

export interface TaskPlanEntityProps {
  _id: string;
  workspaceId: string;
  taskId: string;
  estimateMinutes: number | null;
  taskKind: TaskKind;
  createdAt: Date;
  updatedAt: Date;
}
