import { SavedView } from '@/types/api.types';

export interface ViewTabsProps {
  listId: string;
}

export interface ViewFormState {
  renaming: SavedView | null;
}
