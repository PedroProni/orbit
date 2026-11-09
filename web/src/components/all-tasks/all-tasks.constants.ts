import { StatusType } from '@/types/api.types';

export const STATUS_TYPE_RANK: Record<StatusType, number> = { open: 0, active: 1, review: 2, done: 3, closed: 4 };
export const ALL_TASKS_VIEWS = ['board', 'table'] as const;
