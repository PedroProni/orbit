import { TaskPriority } from '@domain/enums/task.enums';
import { TaskKind } from '@domain/enums/task-kind.enums';

export interface TaskTemplateEntityProps {
  _id: string;
  workspaceId: string;
  spaceId: string;
  name: string;
  titleTemplate: string;
  descriptionMd: string;
  tags: string[];
  priority: TaskPriority | null;
  taskKind: TaskKind;
  estimateMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
}
