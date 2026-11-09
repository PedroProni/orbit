import { BoardGroupBy, BoardSwimlane, CardField, ViewSortBy } from '@/types/view-display.types';

export const GROUP_BY_OPTIONS: BoardGroupBy[] = ['status', 'assignee', 'priority', 'tag'];
export const SWIMLANE_OPTIONS: BoardSwimlane[] = ['none', 'assignee', 'priority'];
export const SORT_OPTIONS: ViewSortBy[] = ['manual', 'priority', 'dueDate', 'title', 'points', 'updatedAt'];
export const CARD_FIELD_OPTIONS: CardField[] = ['priority', 'tags', 'assignees', 'dueDate', 'points', 'subtasks', 'checklist'];
export const WIP_LIMIT_MAX = 999;
