export interface SavedViewFilters {
  statuses: string[];
  assigneeIds: string[];
  tags: string[];
  q: string;
  includeClosed: boolean;
  unassigned?: boolean;
}
