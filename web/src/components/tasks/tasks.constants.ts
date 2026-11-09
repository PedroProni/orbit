import { TaskPriority } from '@/types/api.types';

export const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'normal', 'low'];
export const PRIORITY_COLORS: Record<TaskPriority, string> = { urgent: 'var(--priority-urgent)', high: 'var(--priority-high)', normal: 'var(--priority-normal)', low: 'var(--priority-low)' };
export const NO_PRIORITY_COLOR = 'var(--priority-none)';
export const STATUS_COLOR_TOKENS: Record<string, string> = { 'to do': 'var(--status-todo)', 'in progress': 'var(--status-progress)', 'in review': 'var(--status-review)', done: 'var(--status-done)', cancelled: 'var(--status-cancelled)' };
export const VIEW_MODES = ['list', 'board', 'table', 'calendar', 'timeline', 'workload'] as const;
export const TIMELINE_DAYS = 42;
export const DAY_MS = 86400000;
export const LIST_COLUMNS_CLASS = 'grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_90px_130px_110px] lg:grid-cols-[minmax(0,1fr)_90px_130px_110px_140px_50px]';
export const ACTIVITY_HIDDEN_FIELDS = ['updatedAt', 'dateClosed', 'checklists', 'descriptionMd'];
export const ACTIVITY_FIELDS = ['title', 'status', 'priority', 'tags', 'assigneeIds', 'watcherIds', 'points', 'startDate', 'dueDate', 'listId', 'spaceId', 'parentId', 'archived', 'customFields'] as const;
export const ACTIVITY_PEOPLE_FIELDS = ['assigneeIds', 'watcherIds'];
export const TASK_LINK_PARAM = 'task';
export const PREFIX_ERROR_PREFIX = 'Title must start with';
export const TAG_ERROR_PREFIX = 'At least one tag is required';
export const STATUS_ERROR_PREFIX = 'Unknown status';
export const CREATE_ERROR_FORBIDDEN_STATUS = 403;
