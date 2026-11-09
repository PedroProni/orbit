import { SavedViewType } from '@domain/enums/saved-view.enums';
import { SavedViewFilters } from '@domain/types/saved-view-filters.type';
import { SavedViewDisplay } from '@domain/types/saved-view-display.type';

export interface SavedViewEntityProps {
  _id: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  viewType: SavedViewType;
  listId: string | null;
  filters: SavedViewFilters;
  display: SavedViewDisplay | null;
  shared: boolean;
  createdAt: Date;
  updatedAt: Date;
}
