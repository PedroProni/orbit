export const AUTOMATION_RUN_REASON = {
  NO_CHANGE: 'no_change',
  STATUS_NOT_IN_SPACE: 'status_not_in_space',
  TASK_NOT_FOUND: 'task_not_found',
  WEBHOOK_TIMEOUT: 'webhook_timeout',
  WEBHOOK_BLOCKED_ADDRESS: 'webhook_blocked_address',
  WEBHOOK_STATUS_PREFIX: 'webhook_status_',
  ERROR: 'error',
} as const;
