export enum AutomationTriggerType {
  TASK_CREATED = 'task_created',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  ASSIGNEE_ADDED = 'assignee_added',
  DATE_REACHED = 'date_reached',
}

export enum AutomationActionType {
  ASSIGN = 'assign',
  ADD_TAG = 'add_tag',
  SET_PRIORITY = 'set_priority',
  SET_STATUS = 'set_status',
  COMMENT = 'comment',
  NOTIFY = 'notify',
  WEBHOOK = 'webhook',
}

export enum AutomationDateField {
  START_DATE = 'start_date',
  DUE_DATE = 'due_date',
}

export enum AutomationNotifyTarget {
  ASSIGNEES = 'assignees',
  WATCHERS = 'watchers',
  USERS = 'users',
}
