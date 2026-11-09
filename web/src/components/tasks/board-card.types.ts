import { Task } from '@/types/api.types';
import { CardField } from '@/types/view-display.types';
import { BoardPerson } from './board.types';

export interface CardBodyProps {
  task: Task;
  tasks: Task[];
  people: BoardPerson[];
  fields: CardField[];
  origin?: string;
}

export interface BoardCardProps extends CardBodyProps {
  column: string;
  lane: string;
  readOnly: boolean;
}
