import { TaskPatch } from '@/services/orbit.types';
import { SpaceNode, Task } from '@/types/api.types';

export interface BoardTarget {
  listId: string;
  space: SpaceNode;
}

export interface BoardDropRefusal {
  key: string;
  values: Record<string, string>;
}

export interface KanbanBoardProps {
  tasks: Task[];
  space: SpaceNode;
  listId: string;
  readOnly?: boolean;
  refuseDrop?: (task: Task, patch: TaskPatch) => BoardDropRefusal | null;
  targetFor?: (column: string) => BoardTarget | null;
  originOf?: (task: Task) => string;
}
