export interface ListTasksQuery {
  page: number;
  limit: number;
  listId?: string;
  spaceId?: string;
  parentId?: string;
  topLevel?: boolean;
  statuses?: string[];
  assigneeIds?: string[];
  unassigned?: boolean;
  tags?: string[];
  search?: string;
  includeClosed: boolean;
  includeArchived: boolean;
  updatedAfter?: Date;
  updatedBefore?: Date;
  createdAfter?: Date;
  dueBefore?: Date;
  dueAfter?: Date;
  orderBy: 'updated_at' | 'created_at' | 'due_date';
  reverse: boolean;
}
