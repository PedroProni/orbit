import { SpaceNode, StatusDefinition, Task } from '@/types/api.types';

export interface TaskGroupProps {
  status: StatusDefinition;
  tasks: Task[];
  people: Array<{ id: string; name: string }>;
  space: SpaceNode;
  listId: string;
  readOnly?: boolean;
}
