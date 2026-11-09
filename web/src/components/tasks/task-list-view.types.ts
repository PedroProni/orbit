import { SpaceNode, Task } from '@/types/api.types';

export interface TaskListViewProps {
  tasks: Task[];
  space: SpaceNode;
  listId: string;
  readOnly?: boolean;
}
