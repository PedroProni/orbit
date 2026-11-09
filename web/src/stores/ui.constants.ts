import { TaskFilters } from '@/types/api.types';
import { CardField, ViewDisplay } from '@/types/view-display.types';

export const EMPTY_FILTERS: TaskFilters = { statuses: [], assigneeIds: [], tags: [], q: '', includeClosed: true, unassigned: false };
export const ALL_CARD_FIELDS: CardField[] = ['priority', 'tags', 'assignees', 'dueDate', 'points', 'subtasks', 'checklist'];
export const DEFAULT_DISPLAY: ViewDisplay = { groupBy: 'status', swimlane: 'none', sortBy: 'manual', sortDirection: 'asc', cardFields: ALL_CARD_FIELDS, hideEmpty: false, collapsedColumns: [], wipLimits: [] };
