export enum SavedViewType {
  LIST = 'list',
  BOARD = 'board',
  TABLE = 'table',
  CALENDAR = 'calendar',
  TIMELINE = 'timeline',
  WORKLOAD = 'workload',
}

export enum SavedViewGroupBy {
  STATUS = 'status',
  ASSIGNEE = 'assignee',
  PRIORITY = 'priority',
  TAG = 'tag',
}

export enum SavedViewSwimlane {
  NONE = 'none',
  ASSIGNEE = 'assignee',
  PRIORITY = 'priority',
}

export enum SavedViewSortBy {
  MANUAL = 'manual',
  PRIORITY = 'priority',
  DUE_DATE = 'dueDate',
  TITLE = 'title',
  POINTS = 'points',
  UPDATED_AT = 'updatedAt',
}

export enum SavedViewSortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SavedViewCardField {
  PRIORITY = 'priority',
  TAGS = 'tags',
  ASSIGNEES = 'assignees',
  DUE_DATE = 'dueDate',
  POINTS = 'points',
  SUBTASKS = 'subtasks',
  CHECKLIST = 'checklist',
}
