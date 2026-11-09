import { SpaceNode, Task } from '@/types/api.types';
import { ViewDisplay } from '@/types/view-display.types';
import { BoardColumnModel, BoardPerson } from './board.types';
import { BoardTarget } from './kanban-board.types';

export interface BoardColumnProps {
  column: BoardColumnModel;
  lane: string;
  display: ViewDisplay;
  total: number;
  all: Task[];
  people: BoardPerson[];
  listId: string;
  space: SpaceNode;
  readOnly: boolean;
  fill: boolean;
  label: (key: string) => string;
  onToggleCollapse: (key: string) => void;
  target?: BoardTarget | null;
  originOf?: (task: Task) => string;
}
