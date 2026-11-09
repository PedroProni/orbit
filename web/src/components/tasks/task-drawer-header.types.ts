import { SpaceNode, Task } from '@/types/api.types';

export interface TaskDrawerHeaderProps {
  task: Task;
  space: SpaceNode;
  siblings: Task[];
  readOnly: boolean;
  people: Array<{ id: string; name: string }>;
  onToggleWatcher: (id: string) => void;
}

export interface BreadcrumbPart {
  key: string;
  label: string;
}
