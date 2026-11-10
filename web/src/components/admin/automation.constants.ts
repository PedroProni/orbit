import { AutomationActionType, AutomationRunStatus, AutomationTriggerType } from '@/services/automation.types';

export const AUTOMATION_TRIGGERS: AutomationTriggerType[] = ['task_created', 'status_changed', 'priority_changed', 'assignee_added', 'date_reached'];
export const AUTOMATION_ACTIONS: AutomationActionType[] = ['assign', 'add_tag', 'set_priority', 'set_status', 'comment', 'notify', 'webhook'];
export const AUTOMATION_NOTIFY_TARGETS = ['assignees', 'watchers', 'users'] as const;
export const AUTOMATION_NOTIFY_USERS = 'users';
export const AUTOMATION_DATE_FIELDS = ['start_date', 'due_date'] as const;
export const AUTOMATION_REQUIRED_TRIGGER_VALUES: AutomationTriggerType[] = ['status_changed', 'date_reached'];
export const AUTOMATION_ANY_VALUE = '';
export const AUTOMATION_ALL_LISTS = '';
export const AUTOMATION_NAME_MAX_LENGTH = 80;
export const AUTOMATION_COMMENT_MAX_LENGTH = 2000;
export const AUTOMATION_WEBHOOK_MAX_LENGTH = 2048;
export const AUTOMATION_WEBHOOK_SCHEME = 'https:';
export const AUTOMATION_KNOWN_REASONS = ['status_not_in_space', 'no_change', 'webhook_timeout', 'webhook_blocked_address', 'task_not_found', 'error'] as const;
export const AUTOMATION_WEBHOOK_STATUS_REASON = /^webhook_status_(\d{3})$/;
export const AUTOMATION_FALLBACK_REASON = 'error';
export const AUTOMATION_RUN_BADGE_CLASS: Record<AutomationRunStatus, string> = {
  done: 'bg-[color-mix(in_srgb,var(--status-done)_16%,transparent)] text-[var(--status-done)]',
  skipped: 'bg-panel2 text-muted',
  failed: 'bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-danger',
};
export const AUTOMATION_DIALOG_PANEL_CLASS = 'flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-linestrong bg-raised shadow-floating';
