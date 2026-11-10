export const GITHUB_DELIVERY_EVENTS = ['pull_request', 'push', 'create', 'delete', 'check_suite', 'check_run', 'status', 'ping'] as const;
export const GITHUB_DELIVERY_OUTCOMES = ['processed', 'ignored', 'failed'] as const;
export const GITHUB_OUTCOME_CLASSES: Record<string, string> = { processed: 'bg-accentsoft text-fg', ignored: 'bg-panel2 text-muted', failed: 'bg-danger/15 text-danger' };
export const GITHUB_PENDING_OUTCOME_CLASS = 'bg-panel2 text-muted';
export const GITHUB_ALL = '';
export const MS_PER_MINUTE = 60000;
