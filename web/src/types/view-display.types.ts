export type BoardGroupBy = 'status' | 'assignee' | 'priority' | 'tag';
export type BoardSwimlane = 'none' | 'assignee' | 'priority';
export type ViewSortBy = 'manual' | 'priority' | 'dueDate' | 'title' | 'points' | 'updatedAt';
export type ViewSortDirection = 'asc' | 'desc';
export type CardField = 'priority' | 'tags' | 'assignees' | 'dueDate' | 'points' | 'subtasks' | 'checklist';

export interface WipLimit {
  column: string;
  limit: number;
}

export interface ViewDisplay {
  groupBy: BoardGroupBy;
  swimlane: BoardSwimlane;
  sortBy: ViewSortBy;
  sortDirection: ViewSortDirection;
  cardFields: CardField[];
  hideEmpty: boolean;
  collapsedColumns: string[];
  wipLimits: WipLimit[];
}
