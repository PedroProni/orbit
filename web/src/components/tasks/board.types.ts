import { StatusDefinition, Task } from '@/types/api.types';
import { BoardGroupBy, BoardSwimlane } from '@/types/view-display.types';

export interface BoardPerson {
  id: string;
  name: string;
}

export interface BoardColumnModel {
  key: string;
  status?: StatusDefinition;
  tasks: Task[];
}

export interface BoardLaneModel {
  key: string;
  columns: BoardColumnModel[];
}

export interface BoardLayoutInput {
  tasks: Task[];
  statuses: StatusDefinition[];
  groupBy: BoardGroupBy;
  swimlane: BoardSwimlane;
  people: BoardPerson[];
}

export interface BoardDragData {
  taskId: string;
  column: string;
  lane: string;
}

export interface BoardDropData {
  column: string;
  lane: string;
}

export interface MoveValueResult {
  add: string[];
  remove: string[];
}
