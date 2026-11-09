import { SavedViewCardField, SavedViewGroupBy, SavedViewSortBy, SavedViewSortDirection, SavedViewSwimlane } from '@domain/enums/saved-view.enums';

export interface SavedViewWipLimit {
  column: string;
  limit: number;
}

export interface SavedViewDisplay {
  groupBy: SavedViewGroupBy;
  swimlane: SavedViewSwimlane;
  sortBy: SavedViewSortBy;
  sortDirection: SavedViewSortDirection;
  cardFields: SavedViewCardField[];
  hideEmpty: boolean;
  collapsedColumns: string[];
  wipLimits: SavedViewWipLimit[];
}
