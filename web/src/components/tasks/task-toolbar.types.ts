import { SpaceNode } from '@/types/api.types';

export interface TaskToolbarProps {
  listId: string | null;
  space?: SpaceNode;
  readOnly: boolean;
}
